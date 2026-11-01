const Room = require('../models/Room');
const RoomBooking = require('../models/RoomBooking');
const TimetableEntry = require('../models/TimetableEntry');

// Repository = data-access only. No business rules, no HTTP.

// --- Rooms ---
const findRooms = (filter = {}, sort = { floor: 1, name: 1 }) => {
  return Room.find(filter).sort(sort);
};

const findRoomById = (id) => {
  return Room.findById(id);
};

// --- Timetable ---
const findTimetableEntries = (filter = {}, populateTeacher = false) => {
  const query = TimetableEntry.find(filter);
  if (populateTeacher) {
    query.populate('teacherId', 'name email');
  }
  return query;
};

const findTimetableById = (id) => {
  return TimetableEntry.findById(id);
};

// --- Bookings ---
const findBookings = (filter = {}, populateOptions = null) => {
  const query = RoomBooking.find(filter);
  if (populateOptions) {
    if (populateOptions.bookedBy) {
      query.populate('bookedBy', 'name email role');
    }
    if (populateOptions.room) {
      query.populate('room', 'name building floor type');
    }
  }
  return query;
};

const findBookingById = (id) => {
  return RoomBooking.findById(id);
};

const findOneBooking = (filter) => {
  return RoomBooking.findOne(filter);
};

const createBooking = async (data, populateRoom = false) => {
  const booking = await RoomBooking.create(data);
  if (populateRoom) {
    await booking.populate('room', 'name building type floor');
  }
  return booking;
};

const deleteBooking = (bookingDoc) => {
  return bookingDoc.deleteOne();
};

module.exports = {
  findRooms,
  findRoomById,
  findTimetableEntries,
  findTimetableById,
  findBookings,
  findBookingById,
  findOneBooking,
  createBooking,
  deleteBooking,
};
