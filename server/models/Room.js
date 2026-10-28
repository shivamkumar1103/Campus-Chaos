const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    building: {
      type: String,
      default: "Main Building",
      trim: true,
    },
    type: {
      type: String,
      enum: ["class", "lab"],
      default: "class",
    },
    // Optional: floor number if you want floor-wise filtering later
    floor: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);