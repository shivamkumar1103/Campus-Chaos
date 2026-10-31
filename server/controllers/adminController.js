const User = require("../models/User");
const Room = require("../models/Room");
const TimetableEntry = require("../models/TimetableEntry");
const LostFoundItem = require("../models/LostFoundItem");
const Message = require("../models/Message");

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
  while (rows.length && rows[rows.length - 1].every((v) => v.trim() === "")) rows.pop();
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
const getOverviewStats = async (req, res) => {
  try {
    const [totalUsers, totalRooms, totalItems, totalTimetable] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      LostFoundItem.countDocuments(),
      TimetableEntry.countDocuments(),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const lostFoundByStatus = await LostFoundItem.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      totalRooms,
      totalItems,
      totalTimetable,
      usersByRole: usersByRole.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      lostFoundByStatus: lostFoundByStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------
const listUsers = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, usn, department, classKey } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    if (role === "cr" && !classKey) {
      return res.status(400).json({ message: "classKey (e.g. CSE-5A) is required for CR role" });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "student",
      usn: usn || "",
      department: department || "",
      classKey: role === "cr" ? classKey : "",
    });

    const userObj = user.toObject();
    delete userObj.password;
    res.status(201).json(userObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, usn, department, classKey, password } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (role) {
      user.role = role;
      if (role === "cr") {
        user.classKey = classKey || user.classKey || "";
      } else {
        user.classKey = "";
      }
    }
    if (classKey && user.role === "cr") user.classKey = classKey;
    if (usn !== undefined) user.usn = usn;
    if (department !== undefined) user.department = department;
    if (password) user.password = password; // pre('save') re-hashes it

    await user.save();
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "Admin cannot delete their own account" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------------
// ROOM MANAGEMENT
// -------------------------------------------------------------
const createRoom = async (req, res) => {
  try {
    const { name, building, floor, type } = req.body;
    if (!name) return res.status(400).json({ message: "Room name is required" });

    const existing = await Room.findOne({ name, building: building || "Main Building" });
    if (existing) {
      return res.status(400).json({ message: `Room ${name} already exists in ${building || "Main Building"}` });
    }

    const room = await Room.create({
      name,
      building: building || "Main Building",
      floor: floor !== undefined ? Number(floor) : 0,
      type: type || "class",
    });

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, building, floor, type } = req.body;

    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (name) room.name = name;
    if (building) room.building = building;
    if (floor !== undefined) room.floor = Number(floor);
    if (type) room.type = type;

    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check if room has active timetable slots
    const timetableCount = await TimetableEntry.countDocuments({ room: id });
    if (timetableCount > 0) {
      return res.status(400).json({
        message: `Cannot delete room: ${timetableCount} timetable entries are linked to it. Remove or reassign them first.`,
      });
    }

    await room.deleteOne();
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------------
// TIMETABLE MANAGEMENT
// -------------------------------------------------------------
const listTimetable = async (req, res) => {
  try {
    const { day, roomId, classKey, semester } = req.query;
    const filter = {};
    if (day) filter.day = day;
    if (roomId) filter.room = roomId;
    if (classKey) filter.classKey = classKey;
    if (semester) filter.semester = semester;

    const entries = await TimetableEntry.find(filter)
      .populate("room", "name building floor type")
      .populate("teacherId", "name email department")
      .sort({ day: 1, start: 1 });

    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTimetableEntry = async (req, res) => {
  try {
    const { room, day, start, end, subject, teacherId, classKey, semester, year } = req.body;
    if (!room || !day || !start || !end || !subject) {
      return res.status(400).json({ message: "room, day, start, end, and subject are required" });
    }

    if (start >= end) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    // Check for room conflict: start < existing.end && end > existing.start on same day
    const conflict = await TimetableEntry.findOne({
      room,
      day,
      start: { $lt: end },
      end: { $gt: start },
    });

    if (conflict) {
      return res.status(409).json({
        message: `Room conflict: already occupied by '${conflict.subject}' (${conflict.start} - ${conflict.end})`,
      });
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

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { room, day, start, end, subject, teacherId, classKey, semester, year } = req.body;

    const entry = await TimetableEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Timetable entry not found" });

    const newRoom = room || entry.room;
    const newDay = day || entry.day;
    const newStart = start || entry.start;
    const newEnd = end || entry.end;

    if (newStart >= newEnd) {
      return res.status(400).json({ message: "End time must be after start time" });
    }

    // Check conflict against OTHER entries
    const conflict = await TimetableEntry.findOne({
      _id: { $ne: id },
      room: newRoom,
      day: newDay,
      start: { $lt: newEnd },
      end: { $gt: newStart },
    });

    if (conflict) {
      return res.status(409).json({
        message: `Room conflict: already occupied by '${conflict.subject}' (${conflict.start} - ${conflict.end})`,
      });
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

    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await TimetableEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Timetable entry not found" });

    await entry.deleteOne();
    res.json({ message: "Timetable entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/timetable/upload - Bulk CSV schedule upload
const uploadTimetableCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required" });
    }

    const csvText = req.file.buffer.toString("utf8");
    const rows = parseCSV(csvText);

    if (!rows.length) {
      return res.status(400).json({ message: "CSV file is empty or formatted incorrectly" });
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
      const matchedRoom = roomMap.get(roomName);
      if (!matchedRoom) {
        errors.push(`Row ${rowNum}: Room '${row.room || ""}' does not exist.`);
        continue;
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
      const teacherKey = (row.teacherEmail || row.teacher || "").trim().toLowerCase();
      if (teacherKey && teacherMap.has(teacherKey)) {
        teacherId = teacherMap.get(teacherKey)._id;
      }

      entriesToInsert.push({
        room: matchedRoom._id,
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
      return res.status(400).json({ message: "Failed to process CSV", errors });
    }

    const inserted = await TimetableEntry.insertMany(entriesToInsert);

    res.status(201).json({
      message: `Successfully imported ${inserted.length} timetable entries`,
      insertedCount: inserted.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------------
// LOST & FOUND MODERATION
// -------------------------------------------------------------
const listAllLostFound = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminDeleteLostFound = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.deleteOne();
    res.json({ message: "Item deleted by admin" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminUpdateLostFoundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["open", "claimed", "resolved"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const item = await LostFoundItem.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.status = status;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------------------------------------------------
// CHAT AUDIT & OBSERVATION (READ-ONLY)
// -------------------------------------------------------------
const listAllChatThreads = async (req, res) => {
  try {
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
      "name email usn role avatar department classKey"
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getChatThreadHistory = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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
