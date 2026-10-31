const express = require("express");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const {
  getRooms,
  getAvailableRooms,
  getMyBookings,
  bookRoom,
  cancelBooking,
  cancelTimetableSlot,
} = require("../controllers/roomController");

const router = express.Router();

// Public / optional-auth room browsing
router.get("/", optionalAuth, getRooms);
router.get("/available", optionalAuth, getAvailableRooms);

// Authenticated booking management
router.get("/bookings/mine", protect, getMyBookings);
router.post("/book", protect, authorize("teacher", "cr", "admin"), bookRoom);
router.delete("/bookings/:id", protect, cancelBooking);
router.post("/cancel-slot", protect, cancelTimetableSlot);

module.exports = router;