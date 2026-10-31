const express = require("express");
const router = express.Router();
const {
  listPolls,
  getPollById,
  createPoll,
  castVote,
  closePoll,
  deletePoll,
} = require("../controllers/pollController");
const { protect, optionalAuth, authorize } = require("../middleware/auth");

// Public/optional-auth routes
router.get("/", optionalAuth, listPolls);
router.get("/:id", optionalAuth, getPollById);

// Protected actions
router.post("/", protect, createPoll);
router.post("/:id/vote", protect, castVote);
router.patch("/:id/close", protect, closePoll);
router.delete("/:id", protect, deletePoll);

module.exports = router;
