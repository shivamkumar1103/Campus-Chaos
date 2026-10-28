const mongoose = require("mongoose");

const roomBookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      // This will be overridden to "today" at server level
    },
    start: {
      type: String,
      required: true,
      // Format: "HH:MM" (24-hour)
    },
    end: {
      type: String,
      required: true,
      // Format: "HH:MM" (24-hour)
    },
    kind: {
      type: String,
      enum: ["adhoc", "cancel"],
      default: "adhoc",
    },
    // For kind="cancel": links to the TimetableEntry being cancelled
    linkedTimetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TimetableEntry",
    },
    // Who made this booking/cancellation
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purpose: {
      type: String,
      trim: true,
      // e.g. "DBMS Lab", "Extra lecture", "Exam", etc.
    },
  },
  { timestamps: true }
);

// Index for fast today-only availability queries
roomBookingSchema.index({ room: 1, date: 1, start: 1, end: 1 });

module.exports = mongoose.model("RoomBooking", roomBookingSchema);