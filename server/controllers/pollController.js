const Poll = require("../models/Poll");
const Vote = require("../models/Vote");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Helper to auto-close expired polls
const syncPollStatuses = async (polls) => {
  const now = new Date();
  const expiredIds = [];
  polls.forEach((p) => {
    if (p.status === "active" && p.expiresAt <= now) {
      p.status = "closed";
      expiredIds.push(p._id);
    }
  });
  if (expiredIds.length > 0) {
    await Poll.updateMany({ _id: { $in: expiredIds } }, { $set: { status: "closed" } });
  }
};

// GET /api/polls
const listPolls = catchAsync(async (req, res, next) => {
  const { type, status, scope, classKey } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (status) filter.status = status;
  if (scope) filter.targetScope = scope;
  if (classKey) filter.classKey = classKey;

  const polls = await Poll.find(filter)
    .populate("createdBy", "name email role classKey department avatar")
    .populate("options.candidateId", "name email usn avatar classKey")
    .sort({ createdAt: -1 });

  await syncPollStatuses(polls);

  // If user is authenticated, attach their vote to each poll
  let userVoteMap = new Map();
  if (req.user) {
    const pollIds = polls.map((p) => p._id);
    const userVotes = await Vote.find({
      pollId: { $in: pollIds },
      userId: req.user._id,
    });
    userVotes.forEach((v) => {
      userVoteMap.set(v.pollId.toString(), v.optionId.toString());
    });
  }

  const response = polls.map((p) => {
    const pObj = p.toObject();
    pObj.userVotedOptionId = userVoteMap.get(p._id.toString()) || null;
    return pObj;
  });

  res.json(response);
});

// GET /api/polls/:id
const getPollById = catchAsync(async (req, res, next) => {
  const poll = await Poll.findById(req.params.id)
    .populate("createdBy", "name email role classKey department avatar")
    .populate("options.candidateId", "name email usn avatar classKey");

  if (!poll) return next(new AppError("Poll not found", 404));

  await syncPollStatuses([poll]);

  const pObj = poll.toObject();
  if (req.user) {
    const vote = await Vote.findOne({ pollId: poll._id, userId: req.user._id });
    pObj.userVotedOptionId = vote ? vote.optionId.toString() : null;
  }

  res.json(pObj);
});

// POST /api/polls
const createPoll = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    type,
    targetScope,
    classKey,
    department,
    options,
    durationHours,
    expiresAt,
    isAnonymous,
  } = req.body;

  if (!title || !options || options.length < 2) {
    return next(new AppError("Title and at least 2 options/candidates are required.", 400));
  }

  // Role check: Admin, CR, or Teacher
  const userRole = req.user.role;
  if (!["admin", "cr", "teacher"].includes(userRole)) {
    return next(new AppError("Only Admins, CRs, and Faculty are authorized to launch campus polls.", 403));
  }

  // Determine target scope
  let finalScope = targetScope || "campus";
  let finalClassKey = classKey || "";
  let finalDept = department || "";

  if (userRole === "cr") {
    if (finalScope === "class") {
      if (!req.user.classKey) {
        return next(new AppError("Your CR profile is missing an assigned class section. Please contact Admin.", 400));
      }
      finalClassKey = req.user.classKey;
    }
  }

  // Expiry calculation
  let expiryDate = expiresAt ? new Date(expiresAt) : null;
  if (!expiryDate || isNaN(expiryDate.getTime())) {
    const hours = Number(durationHours) || 24;
    expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  const formattedOptions = options.map((opt) => ({
    text: typeof opt === "string" ? opt.trim() : opt.text?.trim(),
    candidateId: opt.candidateId || null,
    votesCount: 0,
  }));

  const poll = await Poll.create({
    title: title.trim(),
    description: (description || "").trim(),
    type: type || "flash",
    targetScope: finalScope,
    classKey: finalClassKey,
    department: finalDept,
    options: formattedOptions,
    createdBy: req.user._id,
    expiresAt: expiryDate,
    status: "active",
    isAnonymous: isAnonymous !== undefined ? Boolean(isAnonymous) : true,
    totalVotes: 0,
  });

  const populated = await Poll.findById(poll._id)
    .populate("createdBy", "name email role classKey department avatar")
    .populate("options.candidateId", "name email usn avatar classKey");

  // Real-time broadcast
  req.app.get("io")?.emit("poll_created", populated);
  req.app.get("io")?.emit("admin_stats_changed");

  res.status(201).json(populated);
});

// POST /api/polls/:id/vote
const castVote = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { optionId } = req.body;

  if (!optionId) {
    return next(new AppError("optionId is required to cast a ballot.", 400));
  }

  const poll = await Poll.findById(id);
  if (!poll) return next(new AppError("Poll not found", 404));

  // Check status & expiry
  if (poll.status === "closed" || poll.expiresAt <= new Date()) {
    if (poll.status !== "closed") {
      poll.status = "closed";
      await poll.save();
    }
    return next(new AppError("This poll is closed. Voting has concluded.", 400));
  }

  // Eligibility check
  const user = req.user;
  if (poll.targetScope === "class" && user.role !== "admin") {
    if (!user.classKey || user.classKey.trim().toUpperCase() !== poll.classKey.trim().toUpperCase()) {
      return next(new AppError(`Ineligible: This ballot is strictly locked to ${poll.classKey} cadets.`, 403));
    }
  }

  if (poll.targetScope === "department" && user.role !== "admin") {
    if (user.department?.toUpperCase() !== poll.department?.toUpperCase()) {
      return next(new AppError(`Ineligible: This ballot is locked to ${poll.department} department.`, 403));
    }
  }

  // Check option validity
  const targetOption = poll.options.id(optionId);
  if (!targetOption) {
    return next(new AppError("Invalid option selected.", 400));
  }

  // Check if user already voted (also guarded by unique Mongo index)
  const existing = await Vote.findOne({ pollId: poll._id, userId: user._id });
  if (existing) {
    return next(new AppError("You have already cast your ballot for this poll.", 400));
  }

  // Record Vote
  await Vote.create({
    pollId: poll._id,
    userId: user._id,
    optionId,
  });

  // Atomically increment option votes & total votes
  const updatedPoll = await Poll.findOneAndUpdate(
    { _id: poll._id, "options._id": optionId },
    { $inc: { "options.$.votesCount": 1, totalVotes: 1 } },
    { new: true }
  )
    .populate("createdBy", "name email role classKey department avatar")
    .populate("options.candidateId", "name email usn avatar classKey");

  // Real-time broadcast
  req.app.get("io")?.emit("poll_voted", {
    pollId: poll._id,
    options: updatedPoll.options,
    totalVotes: updatedPoll.totalVotes,
  });

  const responseObj = updatedPoll.toObject();
  responseObj.userVotedOptionId = optionId;

  res.json({
    message: "Ballot cast successfully",
    votedOptionId: optionId,
    poll: responseObj,
  });
});

// PATCH /api/polls/:id/close
const closePoll = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const poll = await Poll.findById(id);
  if (!poll) return next(new AppError("Poll not found", 404));

  // Only creator or admin can close
  if (req.user.role !== "admin" && poll.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to close this poll.", 403));
  }

  poll.status = "closed";
  await poll.save();

  req.app.get("io")?.emit("poll_closed", { pollId: poll._id });
  req.app.get("io")?.emit("admin_stats_changed");

  res.json({ message: "Poll closed successfully", poll });
});

// DELETE /api/polls/:id
const deletePoll = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const poll = await Poll.findById(id);
  if (!poll) return next(new AppError("Poll not found", 404));

  // Only creator or admin can delete
  if (req.user.role !== "admin" && poll.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError("Not authorized to delete this poll.", 403));
  }

  await Vote.deleteMany({ pollId: poll._id });
  await poll.deleteOne();

  req.app.get("io")?.emit("poll_deleted", { pollId: poll._id });
  req.app.get("io")?.emit("admin_stats_changed");

  res.json({ message: "Poll deleted successfully" });
});

module.exports = {
  listPolls,
  getPollById,
  createPoll,
  castVote,
  closePoll,
  deletePoll,
};
