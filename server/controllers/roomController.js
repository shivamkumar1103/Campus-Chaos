// Thin HTTP layer — delegates to roomService. No DB calls here.
const roomService = require('../services/roomService');

// GET /api/rooms - List rooms with optional filters
const getRooms = async (req, res) => {
  try {
    const { building, block, floor, type } = req.query;
    const rooms = await roomService.getRooms({ building, block, floor, type });
    res.json(rooms);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/rooms/available - Real-time availability for today
const getAvailableRooms = async (req, res) => {
  try {
    const { start, end, block, building, floor, type } = req.query;
    const availableRooms = await roomService.getAvailableRooms(
      { start, end, block, building, floor, type },
      req.user
    );
    res.json(availableRooms);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/rooms/bookings/mine - List logged-in user's bookings for today
const getMyBookings = async (req, res) => {
  try {
    const myBookings = await roomService.getMyBookings(req.user._id);
    res.json(myBookings);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// POST /api/rooms/book - Book a free room for today only
const bookRoom = async (req, res) => {
  try {
    const { roomId, start, end, purpose } = req.body;
    const booking = await roomService.bookRoom({ roomId, start, end, purpose }, req.user);
    res.status(201).json({
      message: 'Room booked successfully',
      booking,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// DELETE /api/rooms/bookings/:id - Cancel own booking
const cancelBooking = async (req, res) => {
  try {
    const result = await roomService.cancelBooking(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// POST /api/rooms/cancel-slot - Cancel a timetable slot (CR/Teacher only)
const cancelTimetableSlot = async (req, res) => {
  try {
    const { timetableId } = req.body;
    const cancelBooking = await roomService.cancelTimetableSlot(timetableId, req.user);
    res.json({
      message: 'Timetable slot cancelled',
      cancelBooking,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

module.exports = {
  getRooms,
  getAvailableRooms,
  getMyBookings,
  bookRoom,
  cancelBooking,
  cancelTimetableSlot,
};
