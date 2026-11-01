const roomRepository = require('../repositories/roomRepository');

// Helper for checking slot overlap: start < s.end && end > s.start
const hasOverlap = (sStart, sEnd, targetStart, targetEnd) => {
  return targetStart < sEnd && targetEnd > sStart;
};

const getRooms = async ({ building, block, floor, type }) => {
  const filter = {};
  if (building || block) {
    filter.building = building || block;
  }
  if (floor !== undefined && floor !== '' && floor !== 'All') {
    filter.floor = Number(floor);
  }
  if (type) {
    filter.type = type;
  }

  return await roomRepository.findRooms(filter);
};

const getAvailableRooms = async ({ start: queryStart, end: queryEnd, block, building, floor, type }, user) => {
  // Filter rooms first
  const roomFilter = {};
  const bld = building || block;
  if (bld) roomFilter.building = bld;
  if (floor !== undefined && floor !== '' && floor !== 'All') roomFilter.floor = Number(floor);
  if (type) roomFilter.type = type;

  const allRooms = await roomRepository.findRooms(roomFilter);

  // Determine current time if not provided
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const currentTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Default slot: from now to next hour
  const checkStart = queryStart || currentTimeStr;
  const checkEnd = queryEnd || `${pad(Math.min(now.getHours() + 1, 23))}:${pad(now.getMinutes())}`;

  // Get today's day name in Indian Standard Time (Asia/Kolkata)
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });
  const todayDay = dayFormatter.format(now);

  // Today's date range for RoomBooking queries
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const roomIds = allRooms.map((r) => r._id);

  // 1. Base timetable entries for today for these rooms
  const timetableEntries = await roomRepository.findTimetableEntries(
    {
      room: { $in: roomIds },
      day: todayDay,
    },
    true
  );

  // 2. Live bookings & cancellations for today
  const liveBookings = await roomRepository.findBookings(
    {
      room: { $in: roomIds },
      date: { $gte: startOfDay, $lte: endOfDay },
    },
    { bookedBy: true }
  );

  const cancelledTimetableIds = new Set(
    liveBookings
      .filter((b) => b.kind === 'cancel' && b.linkedTimetableId)
      .map((b) => b.linkedTimetableId.toString())
  );

  const adhocBookings = liveBookings.filter((b) => b.kind === 'adhoc');

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
      occupiedBy = `${t.subject}${t.classKey ? ` (${t.classKey})` : ''}`;
      activeTimetableId = t._id;
      if (
        user &&
        (user.role === 'admin' ||
          (user.role === 'teacher' && t.teacherId && t.teacherId._id?.toString() === user._id.toString()) ||
          (user.role === 'cr' && user.classKey && t.classKey === user.classKey))
      ) {
        canCancelCurrent = true;
      }
    } else if (activeAdhoc.length > 0) {
      const b = activeAdhoc[0];
      occupiedBy = `${b.purpose || 'Adhoc Booking'} (${b.bookedBy?.name || 'Booked'})`;
      activeBookingId = b._id;
      if (
        user &&
        (user.role === 'admin' ||
          b.bookedBy?._id?.toString() === user._id.toString())
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
      status: isOccupied ? 'occupied' : 'free',
      occupiedBy,
      activeBookingId,
      activeTimetableId,
      canCancelCurrent,
    };
  });

  return availableRooms;
};

const getMyBookings = async (userId) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  return await roomRepository.findBookings(
    {
      bookedBy: userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    },
    { room: true }
  );
};

const bookRoom = async ({ roomId, start, end, purpose }, user) => {
  if (!roomId || !start || !end) {
    const err = new Error('roomId, start, end required');
    err.statusCode = 400;
    throw err;
  }

  if (start >= end) {
    const err = new Error('End time must be after start time');
    err.statusCode = 400;
    throw err;
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Get today's day name in Indian Standard Time (Asia/Kolkata)
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'Asia/Kolkata',
  });
  const todayDay = dayFormatter.format(now);

  // 1. Find overlapping cancellations today for this room
  const cancelsToday = await roomRepository.findBookings({
    room: roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    kind: 'cancel',
  });
  const cancelledTimetableIds = new Set(
    cancelsToday.filter((c) => c.linkedTimetableId).map((c) => c.linkedTimetableId.toString())
  );

  // 2. Check timetable overlap on today's day
  const timetableEntries = await roomRepository.findTimetableEntries({
    room: roomId,
    day: todayDay,
    start: { $lt: end },
    end: { $gt: start },
  });

  const conflictingTimetable = timetableEntries.find(
    (t) => !cancelledTimetableIds.has(t._id.toString())
  );

  // 3. Check live adhoc overlap
  const conflictingBooking = await roomRepository.findOneBooking({
    room: roomId,
    date: { $gte: startOfDay, $lte: endOfDay },
    kind: 'adhoc',
    start: { $lt: end },
    end: { $gt: start },
  });

  if (conflictingTimetable || conflictingBooking) {
    const err = new Error('Room is already occupied at this time');
    err.statusCode = 409;
    throw err;
  }

  // Create the booking
  const booking = await roomRepository.createBooking(
    {
      room: roomId,
      date: now,
      start,
      end,
      kind: 'adhoc',
      bookedBy: user._id,
      purpose: purpose || 'Adhoc Class / Lab',
    },
    true
  );

  return booking;
};

const cancelBooking = async (bookingId, user) => {
  const booking = await roomRepository.findBookingById(bookingId);
  if (!booking) {
    const err = new Error('Booking not found');
    err.statusCode = 404;
    throw err;
  }

  // Only the person who booked it can cancel, or admin
  if (
    booking.bookedBy.toString() !== user._id.toString() &&
    user.role !== 'admin'
  ) {
    const err = new Error('Not authorized to cancel this booking');
    err.statusCode = 403;
    throw err;
  }

  await roomRepository.deleteBooking(booking);
  return { message: 'Booking cancelled successfully' };
};

const cancelTimetableSlot = async (timetableId, user) => {
  if (!timetableId) {
    const err = new Error('timetableId required');
    err.statusCode = 400;
    throw err;
  }

  const entry = await roomRepository.findTimetableById(timetableId);
  if (!entry) {
    const err = new Error('Timetable entry not found');
    err.statusCode = 404;
    throw err;
  }

  // Role-based access control
  if (user.role === 'cr') {
    // CR can only cancel their own classKey
    if (entry.classKey !== user.classKey) {
      const err = new Error('You can only cancel your own class');
      err.statusCode = 403;
      throw err;
    }
  } else if (user.role === 'teacher') {
    // Teacher can only cancel their own slots
    if (entry.teacherId.toString() !== user._id.toString()) {
      const err = new Error('You can only cancel your own classes');
      err.statusCode = 403;
      throw err;
    }
  } else if (user.role !== 'admin') {
    const err = new Error('Not authorized');
    err.statusCode = 403;
    throw err;
  }

  // Create a cancel booking entry
  const cancelBookingDoc = await roomRepository.createBooking({
    room: entry.room,
    date: new Date(),
    start: entry.start,
    end: entry.end,
    kind: 'cancel',
    linkedTimetableId: entry._id,
    bookedBy: user._id,
    purpose: 'Cancelled timetable slot',
  });

  return cancelBookingDoc;
};

module.exports = {
  getRooms,
  getAvailableRooms,
  getMyBookings,
  bookRoom,
  cancelBooking,
  cancelTimetableSlot,
};
