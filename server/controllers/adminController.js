const User = require("../models/User");
const Room = require("../models/Room");
const TimetableEntry = require("../models/TimetableEntry");
const LostFoundItem = require("../models/LostFoundItem");
const Message = require("../models/Message");
const Poll = require("../models/Poll");
const roomService = require("../services/roomService");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

// Helper: parse simple CSV with quoted support
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  while (rows.length && rows[rows.length - 1].every((v) => v.trim() === ""))
    rows.pop();
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? "").trim();
    });
    return obj;
  });
}

// -------------------------------------------------------------
// OVERVIEW / STATS
// -------------------------------------------------------------
const getOverviewStats = catchAsync(async (req, res, next) => {
  const [
    totalUsers,
    totalRooms,
    totalItems,
    totalTimetable,
    totalPolls,
    activePolls,
    usersByRole,
    lostFoundByStatus,
    availableRooms,
  ] = await Promise.all([
    User.countDocuments(),
    Room.countDocuments(),
    LostFoundItem.countDocuments(),
    TimetableEntry.countDocuments(),
    Poll.countDocuments(),
    Poll.countDocuments({ status: "active", expiresAt: { $gt: new Date() } }),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    LostFoundItem.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    roomService.getAvailableRooms({}, req.user).catch((e) => {
      console.error(
        "Failed to calculate available rooms in getOverviewStats:",
        e,
      );
      return [];
    }),
  ]);

  const freeRoomsRightNow = Array.isArray(availableRooms)
    ? availableRooms.filter((r) => r.isAvailable || r.status === "free").length
    : 0;
  const occupiedRoomsRightNow = Array.isArray(availableRooms)
    ? availableRooms.filter((r) => r.isOccupied || r.status === "occupied")
        .length
    : 0;

  const roleMap = usersByRole.reduce(
    (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
    {},
  );
  const lfMap = lostFoundByStatus.reduce(
    (acc, curr) => ({ ...acc, [curr._id]: curr.count }),
    {},
  );

  res.json({
    totalUsers,
    totalRooms,
    totalTimetable,
    totalPolls,
    activePolls,
    freeRoomsRightNow,
    occupiedRoomsRightNow,
    userRoles: roleMap,
    usersByRole: roleMap,
    lostFound: {
      total: totalItems,
      open: lfMap.open || 0,
      claimed: lfMap.claimed || 0,
      resolved: lfMap.resolved || 0,
    },
    lostFoundByStatus: lfMap,
    totalItems,
  });
});

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------
const listUsers = catchAsync(async (req, res, next) => {
  const { role, q, department, classKey } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (classKey) filter.classKey = classKey;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { usn: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 });

  res.json(users);
});

const createUser = catchAsync(async (req, res, next) => {
  const { name, email, password, role, usn, department, classKey } = req.body;
  if (!name || !email || !password) {
    return next(new AppError("Name, email, and password are required", 400));
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new AppError("User with this email already exists", 400));
  }

  if (role === "cr" && !classKey) {
    return next(
      new AppError("classKey (e.g. CSE-5A) is required for CR role", 400),
    );
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: role || "student",
    usn: usn ? usn.trim().toUpperCase() : "",
    department: department || "",
    classKey: classKey ? classKey.trim().toUpperCase() : "",
  });

  const userObj = user.toObject();
  delete userObj.password;
  req.app.get("io")?.emit("admin_stats_changed");
  res.status(201).json(userObj);
});

const updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, role, usn, department, classKey, password } = req.body;

  const user = await User.findById(id);
  if (!user) return next(new AppError("User not found", 404));

  if (name) user.name = name;
  if (role) {
    user.role = role;
    if (role === "cr" && !classKey && !user.classKey) {
      return next(
        new AppError("classKey (e.g. CSE-5A) is required for CR role", 400),
      );
    }
    if (role === "teacher" || role === "admin") {
      if (!classKey) user.classKey = "";
    }
  }

  if (classKey !== undefined) {
    user.classKey = classKey ? classKey.trim().toUpperCase() : "";
  }

  if (usn !== undefined) user.usn = usn ? usn.trim().toUpperCase() : "";
  if (department !== undefined) user.department = department;
  if (password) user.password = password; // pre('save') re-hashes it

  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  req.app.get("io")?.emit("admin_stats_changed");
  res.json(userObj);
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (id === req.user._id.toString()) {
    return next(new AppError("Admin cannot delete their own account", 400));
  }

  const user = await User.findById(id);
  if (!user) return next(new AppError("User not found", 404));

  await user.deleteOne();
  req.app.get("io")?.emit("admin_stats_changed");
  res.json({ message: "User deleted successfully" });
});

// -------------------------------------------------------------
// ROOM MANAGEMENT
// -------------------------------------------------------------
const createRoom = catchAsync(async (req, res, next) => {
  const { name, building, floor, type } = req.body;
  if (!name) return next(new AppError("Room name is required", 400));

  const defaultBuilding = "Ramanujacharya Bhavana (RB)";
  const targetBuilding = building || defaultBuilding;

  const existing = await Room.findOne({ name, building: targetBuilding });
  if (existing) {
    return next(
      new AppError(`Room ${name} already exists in ${targetBuilding}`, 400),
    );
  }

  const room = await Room.create({
    name,
    building: targetBuilding,
    floor: floor !== undefined ? Number(floor) : 0,
    type: type || "class",
  });

  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");
  res.status(201).json(room);
});

const updateRoom = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, building, floor, type } = req.body;

  const room = await Room.findById(id);
  if (!room) return next(new AppError("Room not found", 404));

  if (name) room.name = name;
  if (building) room.building = building;
  if (floor !== undefined) room.floor = Number(floor);
  if (type) room.type = type;

  await room.save();
  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");
  res.json(room);
});

const deleteRoom = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const room = await Room.findById(id);
  if (!room) return next(new AppError("Room not found", 404));

  // Check if room has active timetable slots
  const timetableCount = await TimetableEntry.countDocuments({ room: id });
  if (timetableCount > 0) {
    return next(
      new AppError(
        `Cannot delete room: ${timetableCount} timetable entries are linked to it. Remove or reassign them first.`,
        400,
      ),
    );
  }

  await room.deleteOne();
  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");
  res.json({ message: "Room deleted successfully" });
});

// -------------------------------------------------------------
// TIMETABLE MANAGEMENT
// -------------------------------------------------------------
const listTimetable = catchAsync(async (req, res, next) => {
  const { day, roomId, classKey, semester, search } = req.query;
  const filter = {};
  if (day && day !== "All") filter.day = day;
  if (roomId) filter.room = roomId;
  if (classKey && classKey !== "All") {
    filter.classKey = new RegExp(`^${classKey.trim()}$`, "i");
  }
  if (semester && semester !== "All") {
    filter.semester = semester.trim();
  }
  if (search) {
    const rx = new RegExp(
      search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    filter.$or = [{ subject: rx }, { classKey: rx }];
  }

  const entries = await TimetableEntry.find(filter)
    .populate("room", "name building floor type")
    .populate("teacherId", "name email department")
    .sort({ day: 1, start: 1 });

  res.json(entries);
});

const createTimetableEntry = catchAsync(async (req, res, next) => {
  const {
    room,
    day,
    start,
    end,
    subject,
    teacherId,
    classKey,
    semester,
    year,
  } = req.body;
  if (!room || !day || !start || !end || !subject) {
    return next(
      new AppError("room, day, start, end, and subject are required", 400),
    );
  }

  if (start >= end) {
    return next(new AppError("End time must be after start time", 400));
  }

  // Check for room conflict if a room is assigned
  if (room) {
    const conflict = await TimetableEntry.findOne({
      room,
      day,
      start: { $lt: end },
      end: { $gt: start },
    });

    if (conflict) {
      return next(
        new AppError(
          `Room conflict: already occupied by '${conflict.subject}' (${conflict.start} - ${conflict.end})`,
          409,
        ),
      );
    }
  }

  const entry = await TimetableEntry.create({
    room,
    day,
    start,
    end,
    subject,
    teacherId: teacherId || null,
    classKey: classKey || "",
    semester: semester || "5th",
    year: year || 3,
  });

  await entry.populate([
    { path: "room", select: "name building floor type" },
    { path: "teacherId", select: "name email department" },
  ]);

  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");
  res.status(201).json(entry);
});

const updateTimetableEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    room,
    day,
    start,
    end,
    subject,
    teacherId,
    classKey,
    semester,
    year,
  } = req.body;

  const entry = await TimetableEntry.findById(id);
  if (!entry) return next(new AppError("Timetable entry not found", 404));

  const newRoom = room || entry.room;
  const newDay = day || entry.day;
  const newStart = start || entry.start;
  const newEnd = end || entry.end;

  if (newStart >= newEnd) {
    return next(new AppError("End time must be after start time", 400));
  }

  // Check conflict against OTHER entries if a room is assigned
  if (newRoom) {
    const conflict = await TimetableEntry.findOne({
      _id: { $ne: id },
      room: newRoom,
      day: newDay,
      start: { $lt: newEnd },
      end: { $gt: newStart },
    });

    if (conflict) {
      return next(
        new AppError(
          `Room conflict: already occupied by '${conflict.subject}' (${conflict.start} - ${conflict.end})`,
          409,
        ),
      );
    }
  }

  if (room) entry.room = room;
  if (day) entry.day = day;
  if (start) entry.start = start;
  if (end) entry.end = end;
  if (subject) entry.subject = subject;
  if (teacherId !== undefined) entry.teacherId = teacherId || null;
  if (classKey !== undefined) entry.classKey = classKey;
  if (semester !== undefined) entry.semester = semester;
  if (year !== undefined) entry.year = year;

  await entry.save();
  await entry.populate([
    { path: "room", select: "name building floor type" },
    { path: "teacherId", select: "name email department" },
  ]);

  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");
  res.json(entry);
});

const deleteTimetableEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const entry = await TimetableEntry.findById(id);
  if (!entry) return next(new AppError("Timetable entry not found", 404));

  await entry.deleteOne();
  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");
  res.json({ message: "Timetable entry deleted successfully" });
});

// POST /api/admin/timetable/upload - Bulk CSV schedule upload
const uploadTimetableCsv = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("CSV file is required", 400));
  }

  const csvText = req.file.buffer.toString("utf8");
  const rows = parseCSV(csvText);

  if (!rows.length) {
    return next(
      new AppError("CSV file is empty or formatted incorrectly", 400),
    );
  }

  // Cache existing rooms and teachers for fast matching
  const allRooms = await Room.find({});
  const roomMap = new Map();
  allRooms.forEach((r) => roomMap.set(r.name.trim().toLowerCase(), r));

  const allTeachers = await User.find({ role: { $in: ["teacher", "admin"] } });
  const teacherMap = new Map();
  allTeachers.forEach((t) => {
    teacherMap.set(t.email.toLowerCase(), t);
    teacherMap.set(t.name.toLowerCase(), t);
  });

  const entriesToInsert = [];
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // header is line 1

    const roomName = (row.room || row.roomName || "").trim().toLowerCase();
    let matchedRoom = null;
    if (roomName) {
      matchedRoom = roomMap.get(roomName);
      if (!matchedRoom) {
        errors.push(`Row ${rowNum}: Room '${row.room || ""}' does not exist.`);
        continue;
      }
    }

    const day = (row.day || "").trim();
    const start = (row.start || "").trim();
    const end = (row.end || "").trim();
    const subject = (row.subject || "").trim();
    const classKey = (row.classKey || row.class || "").trim();
    const semester = (row.semester || "5th").trim();

    if (!day || !start || !end || !subject) {
      errors.push(`Row ${rowNum}: Missing day, start, end, or subject.`);
      continue;
    }

    let teacherId = null;
    const teacherKey = (row.teacherEmail || row.teacher || "")
      .trim()
      .toLowerCase();
    if (teacherKey && teacherMap.has(teacherKey)) {
      teacherId = teacherMap.get(teacherKey)._id;
    }

    entriesToInsert.push({
      room: matchedRoom ? matchedRoom._id : null,
      day,
      start,
      end,
      subject,
      teacherId,
      classKey,
      semester,
    });
  }

  if (errors.length > 0 && entriesToInsert.length === 0) {
    const csvError = new AppError("Failed to process CSV", 400);
    csvError.errors = errors;
    return next(csvError);
  }

  const inserted = await TimetableEntry.insertMany(entriesToInsert);

  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("room_status_changed");

  res.status(201).json({
    message: `Successfully imported ${inserted.length} timetable entries`,
    insertedCount: inserted.length,
    errors: errors.length > 0 ? errors : undefined,
  });
});

// -------------------------------------------------------------
// LOST & FOUND MODERATION
// -------------------------------------------------------------
const listAllLostFound = catchAsync(async (req, res, next) => {
  const { status, type, category, q } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (q) filter.$text = { $search: q };

  const items = await LostFoundItem.find(filter)
    .populate("reportedBy", "name email usn role")
    .populate("claimantId", "name email usn role")
    .sort({ createdAt: -1 });

  res.json(items);
});

const adminDeleteLostFound = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const item = await LostFoundItem.findById(id);
  if (!item) return next(new AppError("Item not found", 404));

  await item.deleteOne();
  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("lost_found_updated");
  res.json({ message: "Item deleted by admin" });
});

const adminUpdateLostFoundStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["open", "claimed", "resolved"].includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const item = await LostFoundItem.findById(id);
  if (!item) return next(new AppError("Item not found", 404));

  item.status = status;
  await item.save();
  req.app.get("io")?.emit("admin_stats_changed");
  req.app.get("io")?.emit("lost_found_updated");
  res.json(item);
});

// -------------------------------------------------------------
// CHAT AUDIT & OBSERVATION (READ-ONLY)
// -------------------------------------------------------------
const listAllChatThreads = catchAsync(async (req, res, next) => {
  const messages = await Message.find({}).sort({ createdAt: -1 });

  const threadMap = new Map();
  for (const m of messages) {
    if (!threadMap.has(m.conversationId)) {
      const parts = (m.conversationId || "").split("_");
      const u1Id = parts[0] || m.senderId;
      const u2Id = parts[1] || m.receiverId;
      threadMap.set(m.conversationId, {
        conversationId: m.conversationId,
        user1Id: u1Id,
        user2Id: u2Id,
        lastMessage: m,
        totalMessages: 1,
      });
    } else {
      threadMap.get(m.conversationId).totalMessages += 1;
    }
  }

  const threads = [...threadMap.values()];

  // Populate user details for user1 and user2
  const allUserIds = new Set();
  threads.forEach((t) => {
    if (t.user1Id) allUserIds.add(t.user1Id.toString());
    if (t.user2Id) allUserIds.add(t.user2Id.toString());
  });

  const users = await User.find({ _id: { $in: [...allUserIds] } }).select(
    "name email usn role avatar department classKey",
  );
  const userMap = new Map();
  users.forEach((u) => userMap.set(u._id.toString(), u));

  const populatedThreads = threads.map((t) => {
    const u1Str = t.user1Id ? t.user1Id.toString() : "";
    const u2Str = t.user2Id ? t.user2Id.toString() : "";
    return {
      conversationId: t.conversationId,
      user1: userMap.get(u1Str) || {
        _id: u1Str,
        name: u1Str ? `Cadet (${u1Str.slice(-4)})` : "Cadet",
        role: "student",
      },
      user2: userMap.get(u2Str) || {
        _id: u2Str,
        name: u2Str ? `Cadet (${u2Str.slice(-4)})` : "Cadet",
        role: "student",
      },
      lastMessage: t.lastMessage,
      totalMessages: t.totalMessages,
    };
  });

  res.json(populatedThreads);
});

const getChatThreadHistory = catchAsync(async (req, res, next) => {
  const { user1Id, user2Id } = req.params;
  const conversationId = Message.buildConversationId(user1Id, user2Id);

  const history = await Message.find({ conversationId })
    .sort({ createdAt: 1 })
    .limit(300);

  const [foundU1, foundU2] = await Promise.all([
    User.findById(user1Id).select("name email usn role avatar"),
    User.findById(user2Id).select("name email usn role avatar"),
  ]);

  const user1 = foundU1 || {
    _id: user1Id,
    name: user1Id ? `Cadet (${user1Id.slice(-4)})` : "Cadet",
    role: "student",
  };
  const user2 = foundU2 || {
    _id: user2Id,
    name: user2Id ? `Cadet (${user2Id.slice(-4)})` : "Cadet",
    role: "student",
  };

  res.json({
    conversationId,
    user1,
    user2,
    messages: history,
  });
});

module.exports = {
  getOverviewStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  createRoom,
  updateRoom,
  deleteRoom,
  listTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  uploadTimetableCsv,
  listAllLostFound,
  adminDeleteLostFound,
  adminUpdateLostFoundStatus,
  listAllChatThreads,
  getChatThreadHistory,
};
