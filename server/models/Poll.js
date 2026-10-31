const mongoose = require("mongoose");

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  votesCount: {
    type: Number,
    default: 0,
  },
});

const pollSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      enum: ["flash", "election"],
      default: "flash",
    },
    targetScope: {
      type: String,
      enum: ["campus", "department", "class"],
      default: "campus",
    },
    classKey: {
      type: String,
      trim: true,
      default: "", // e.g. "CSE-5A"
    },
    department: {
      type: String,
      trim: true,
      default: "", // e.g. "CSE"
    },
    options: {
      type: [pollOptionSchema],
      validate: [
        (val) => val.length >= 2,
        "A poll must have at least 2 options or candidates.",
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    totalVotes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

pollSchema.index({ status: 1, expiresAt: 1 });
pollSchema.index({ type: 1, targetScope: 1, classKey: 1 });

module.exports = mongoose.model("Poll", pollSchema);
