const express = require("express");
const router = express.Router();
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const Room = require("../models/Room");
const TimetableEntry = require("../models/TimetableEntry");
const RoomBooking = require("../models/RoomBooking");

// -------------------------------------------------------
// GET /api/rooms - List rooms with optional filters
// -------------------------------------------------------
router.get("/", optionalAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.building || req.query.block) {
      filter.building = req.query.building || req.query.block;
    }
    if (req.query.floor !== undefined && req.query.floor !== "") {
      filter.floor = Number(req.query.floor);
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const rooms = await Room.find(filter).sort({ floor: 1, name: 1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/rooms/available - Real-time availability for today
router.get("/available", optionalAuth, async (req, res) => {
  try {
    const { start: queryStart, end: queryEnd, block, building, floor, type } = req.query;

    // Filter rooms first
    const roomFilter = {};
    const bld = building || block;
    if (bld) roomFilter.building = bld;
    if (floor !== undefined && floor !== "" && floor !== "All") roomFilter.floor = Number(floor);
    if (type) roomFilter.type = type;

    const allRooms = await Room.find(roomFilter).sort({ floor: 1, name: 1 });

    // Determine current time if not provided
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    // Default slot: from now to next hour
    const checkStart = queryStart || currentTimeStr;
    const checkEnd = queryEnd || `${pad(Math.min(now.getHours() + 1, 23))}:${pad(now.getMinutes())}`;

    // Get today's day name in Indian Standard Time (Asia/Kolkata)
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });
    const todayDay = dayFormatter.format(now);

    // Today's date range for RoomBooking queries
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const roomIds = allRooms.map((r) => r._id);

    // 1. Base timetable entries for today for these rooms
    const timetableEntries = await TimetableEntry.find({
      room: { $in: roomIds },
      day: todayDay,
    }).populate("teacherId", "name email");

    // 2. Live bookings & cancellations for today
    const liveBookings = await RoomBooking.find({
      room: { $in: roomIds },
      date: { $gte: startOfDay, $lte: endOfDay },
    }).populate("bookedBy", "name email role");

    const cancelledTimetableIds = new Set(
      liveBookings
        .filter((b) => b.kind === "cancel" && b.linkedTimetableId)
        .map((b) => b.linkedTimetableId.toString())
    );

    const adhocBookings = liveBookings.filter((b) => b.kind === "adhoc");

    // Helper for checking slot overlap: start < s.end && end > s.start
    const hasOverlap = (sStart, sEnd, targetStart, targetEnd) => {
      return targetStart < sEnd && targetEnd > sStart;
    };

    const availableRooms = allRooms.map((room) => {
      const roomIdStr = room._id.toString();

      // Check active timetable entries that overlap checkStart/checkEnd and are NOT cancelled
      const activeTimetable = timetableEntries.filter(
        (entry) =>
          entry.room.toString() === roomIdStr &&
          !cancelledTimetableIds.has(entry._id.toString()) &&
          hasOverlap(entry.start, entry.end, checkStart, checkEnd)
      );

      // Check active adhoc bookings that overlap checkStart/checkEnd
      const activeAdhoc = adhocBookings.filter(
        (booking) =>
          booking.room.toString() === roomIdStr &&
          hasOverlap(booking.start, booking.end, checkStart, checkEnd)
      );

      const isOccupied = activeTimetable.length > 0 || activeAdhoc.length > 0;

      let occupiedBy = null;
      let activeBookingId = null;
      let activeTimetableId = null;
      let canCancelCurrent = false;

      if (activeTimetable.length > 0) {
        const t = activeTimetable[0];
        occupiedBy = `${t.subject}${t.classKey ? ` (${t.classKey})` : ""}`;
        activeTimetableId = t._id;
        if (
          req.user &&
          (req.user.role === "admin" ||
            (req.user.role === "teacher" && t.teacherId && t.teacherId._id?.toString() === req.user._id.toString()) ||
            (req.user.role === "cr" && req.user.classKey && t.classKey === req.user.classKey))
        ) {
          canCancelCurrent = true;
        }
      } else if (activeAdhoc.length > 0) {
        const b = activeAdhoc[0];
        occupiedBy = `${b.purpose || "Adhoc Booking"} (${b.bookedBy?.name || "Booked"})`;
        activeBookingId = b._id;
        if (
          req.user &&
          (req.user.role === "admin" ||
            b.bookedBy?._id?.toString() === req.user._id.toString())
        ) {
          canCancelCurrent = true;
        }
      }

      return {
        _id: room._id,
        name: room.name,
        building: room.building,
        type: room.type,
        floor: room.floor,
        status: isOccupied ? "occupied" : "free",
        occupiedBy,
        activeBookingId,
        activeTimetableId,
        canCancelCurrent,
      };
    });

    res.json(availableRooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------
// GET /api/rooms/bookings/mine - List logged-in user's bookings for today
// -------------------------------------------------------
router.get("/bookings/mine", protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const myBookings = await RoomBooking.find({
      bookedBy: req.user._id,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("room", "name building floor type")
      .sort({ createdAt: -1 });

    res.json(myBookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------
// POST /api/rooms/book - Book a free room for today only
// -------------------------------------------------------
router.post(
  "/book",
  protect,
  authorize("teacher", "cr", "admin"),
  async (req, res) => {
    try {
      const { roomId, start, end, purpose } = req.body;
      if (!roomId || !start || !end) {
        return res.status(400).json({ message: "roomId, start, end required" });
      }

      if (start >= end) {
        return res.status(400).json({ message: "End time must be after start time" });
      }

      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      // Get today's day name in Indian Standard Time (Asia/Kolkata)
      const dayFormatter = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Asia/Kolkata",
      });
      const todayDay = dayFormatter.format(now);

      // 1. Find overlapping cancellations today for this room
      const cancelsToday = await RoomBooking.find({
        room: roomId,
        date: { $gte: startOfDay, $lte: endOfDay },
        kind: "cancel",
      });
      const cancelledTimetableIds = new Set(
        cancelsToday.filter((c) => c.linkedTimetableId).map((c) => c.linkedTimetableId.toString())
      );

      // 2. Check timetable overlap on today's day
      const timetableEntries = await TimetableEntry.find({
        room: roomId,
        day: todayDay,
        start: { $lt: end },
        end: { $gt: start },
      });

      const conflictingTimetable = timetableEntries.find(
        (t) => !cancelledTimetableIds.has(t._id.toString())
      );

      // 3. Check live adhoc overlap
      const conflictingBooking = await RoomBooking.findOne({
        room: roomId,
        date: { $gte: startOfDay, $lte: endOfDay },
        kind: "adhoc",
        start: { $lt: end },
        end: { $gt: start },
      });

      if (conflictingTimetable || conflictingBooking) {
        return res
          .status(409)
          .json({ message: "Room is already occupied at this time" });
      }

      // Create the booking
      const booking = await RoomBooking.create({
        room: roomId,
        date: now,
        start,
        end,
        kind: "adhoc",
        bookedBy: req.user._id,
        purpose: purpose || "Adhoc Class / Lab",
      });

      await booking.populate("room", "name building type floor");

      res.status(201).json({
        message: "Room booked successfully",
        booking,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// -------------------------------------------------------
// DELETE /api/rooms/bookings/:id - Cancel own booking
// -------------------------------------------------------
router.delete(
  "/bookings/:id",
  protect,
  async (req, res) => {
    try {
      const booking = await RoomBooking.findById(req.params.id);
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      // Only the person who booked it can cancel, or admin
      if (
        booking.bookedBy.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res
          .status(403)
          .json({ message: "Not authorized to cancel this booking" });
      }

      await booking.deleteOne();
      res.json({ message: "Booking cancelled successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// -------------------------------------------------------
// POST /api/rooms/cancel-slot - Cancel a timetable slot (CR/Teacher only)
// -------------------------------------------------------
router.post(
  "/cancel-slot",
  protect,
  async (req, res) => {
    try {
      const { timetableId } = req.body;
      if (!timetableId) {
        return res.status(400).json({ message: "timetableId required" });
      }

      const entry = await TimetableEntry.findById(timetableId);
      if (!entry) return res.status(404).json({ message: "Timetable entry not found" });

      // Role-based access control
      if (req.user.role === "cr") {
        // CR can only cancel their own classKey
        if (entry.classKey !== req.user.classKey) {
          return res
            .status(403)
            .json({ message: "You can only cancel your own class" });
        }
      } else if (req.user.role === "teacher") {
        // Teacher can only cancel their own slots
        if (entry.teacherId.toString() !== req.user._id.toString()) {
          return res
            .status(403)
            .json({ message: "You can only cancel your own classes" });
        }
      } else if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Create a cancel booking entry
      const cancelBooking = await RoomBooking.create({
        room: entry.room,
        date: new Date(),
        start: entry.start,
        end: entry.end,
        kind: "cancel",
        linkedTimetableId: entry._id,
        bookedBy: req.user._id,
        purpose: "Cancelled timetable slot",
      });

      res.json({
        message: "Timetable slot cancelled",
        cancelBooking,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;