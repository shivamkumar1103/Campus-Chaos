const roomRepository = require('../repositories/roomRepository');
const AppError = require('../utils/AppError');

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
        entry.room &&
        entry.room.toString() === roomIdStr &&
        !cancelledTimetableIds.has(entry._id.toString()) &&
        hasOverlap(entry.start, entry.end, checkStart, checkEnd)
    );

    // Check active adhoc bookings that overlap checkStart/checkEnd
    const activeAdhoc = adhocBookings.filter(
      (booking) =>
        booking.room &&
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
      isAvailable: !isOccupied,
      isOccupied,
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
    throw new AppError('roomId, start, end required', 400);
  }

  if (start >= end) {
    throw new AppError('End time must be after start time', 400);
  }

  const room = await roomRepository.findRoomById(roomId);
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  // Auditorium restriction: only admin can book
  if (room.type === 'auditorium' && user?.role !== 'admin') {
    throw new AppError('The Auditorium can only be booked by Campus Administrators.', 403);
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
    throw new AppError('Room is already occupied at this time', 409);
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
    throw new AppError('Booking not found', 404);
  }

  // Only the person who booked it can cancel, or admin
  if (
    booking.bookedBy.toString() !== user._id.toString() &&
    user.role !== 'admin'
  ) {
    throw new AppError('Not authorized to cancel this booking', 403);
  }

  await roomRepository.deleteBooking(booking);
  return { message: 'Booking cancelled successfully' };
};

const cancelTimetableSlot = async (timetableId, user) => {
  if (!timetableId) {
    throw new AppError('timetableId required', 400);
  }

  const entry = await roomRepository.findTimetableById(timetableId);
  if (!entry) {
    throw new AppError('Timetable entry not found', 404);
  }

  // Role-based access control
  if (user.role === 'cr') {
    // CR can only cancel their own classKey
    if (entry.classKey !== user.classKey) {
      throw new AppError('You can only cancel your own class', 403);
    }
  } else if (user.role === 'teacher') {
    // Teacher can only cancel their own slots
    if (!entry.teacherId || entry.teacherId.toString() !== user._id.toString()) {
      throw new AppError('You can only cancel your own classes', 403);
    }
  } else if (user.role !== 'admin') {
    throw new AppError('Not authorized', 403);
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
