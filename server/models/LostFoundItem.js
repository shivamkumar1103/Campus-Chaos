const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, enum: ["lost", "found"], required: true },
    category: {
      type: String,
      enum: [
        "electronics",
        "id_cards",
        "books",
        "keys",
        "accessories",
        "clothing",
        "other",
      ],
      default: "other",
    },
    location: { type: String, trim: true }, // location lost/found (kept as `location`, alias locationFound supported)
    locationFound: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    imageUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["open", "claimed", "resolved"],
      default: "open",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimProof: { type: String, default: "" },
  },
  { timestamps: true },
);

lostFoundSchema.index({ title: "text", description: "text" });
lostFoundSchema.index({ type: 1, category: 1, status: 1 });

module.exports = mongoose.model("LostFoundItem", lostFoundSchema);
