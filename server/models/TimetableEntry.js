const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    day: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
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
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Only set for teacher-owned slots; CR can set classKey instead
    },
    classKey: {
      type: String,
      // Format: "CSE-2A", "EEE-3B", etc.
      // Only set for CR-owned slots; teacherId may be empty
    },
    year: {
      type: Number,
      min: 1,
      max: 4,
    },
    semester: {
      type: String,
      enum: ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"],
    },
  },
  { timestamps: true }
);

// Index for fast availability queries
timetableSchema.index({ room: 1, day: 1, start: 1, end: 1 });

module.exports = mongoose.model("TimetableEntry", timetableSchema);