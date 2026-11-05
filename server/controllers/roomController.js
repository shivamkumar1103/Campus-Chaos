// Thin HTTP layer — delegates to roomService. No DB calls here.
const roomService = require('../services/roomService');
const catchAsync = require('../utils/catchAsync');

// GET /api/rooms - List rooms with optional filters
const getRooms = catchAsync(async (req, res, next) => {
  const { building, block, floor, type } = req.query;
  const rooms = await roomService.getRooms({ building, block, floor, type });
  res.json(rooms);
});

// GET /api/rooms/available - Real-time availability for today
const getAvailableRooms = catchAsync(async (req, res, next) => {
  const { start, end, block, building, floor, type } = req.query;
  const availableRooms = await roomService.getAvailableRooms(
    { start, end, block, building, floor, type },
    req.user
  );
  res.json(availableRooms);
});

// GET /api/rooms/bookings/mine - List logged-in user's bookings for today
const getMyBookings = catchAsync(async (req, res, next) => {
  const myBookings = await roomService.getMyBookings(req.user._id);
  res.json(myBookings);
});

// POST /api/rooms/book - Book a free room for today only
const bookRoom = catchAsync(async (req, res, next) => {
  const { roomId, start, end, purpose } = req.body;
  const booking = await roomService.bookRoom({ roomId, start, end, purpose }, req.user);
  req.app.get('io')?.emit('room_status_changed');
  req.app.get('io')?.emit('admin_stats_changed');
  res.status(201).json({
    message: 'Room booked successfully',
    booking,
  });
});

// DELETE /api/rooms/bookings/:id - Cancel own booking
const cancelBooking = catchAsync(async (req, res, next) => {
  const result = await roomService.cancelBooking(req.params.id, req.user);
  req.app.get('io')?.emit('room_status_changed');
  req.app.get('io')?.emit('admin_stats_changed');
  res.json(result);
});

// POST /api/rooms/cancel-slot - Cancel a timetable slot (CR/Teacher only)
const cancelTimetableSlot = catchAsync(async (req, res, next) => {
  const { timetableId } = req.body;
  const cancelBooking = await roomService.cancelTimetableSlot(timetableId, req.user);
  req.app.get('io')?.emit('room_status_changed');
  req.app.get('io')?.emit('admin_stats_changed');
  res.json({
    message: 'Timetable slot cancelled',
    cancelBooking,
  });
});

module.exports = {
  getRooms,
  getAvailableRooms,
  getMyBookings,
  bookRoom,
  cancelBooking,
  cancelTimetableSlot,
};
