const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");
const {
  getOverviewStats,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  createRoom,
  updateRoom,
  deleteRoom,
  listTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  uploadTimetableCsv,
  listAllLostFound,
  adminDeleteLostFound,
  adminUpdateLostFoundStatus,
  listAllChatThreads,
  getChatThreadHistory,
} = require("../controllers/adminController");

const router = express.Router();

// Memory storage for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// All routes require authentication and admin role
router.use(protect, authorize("admin"));

// -------------------------------------------------------------
// OVERVIEW
// -------------------------------------------------------------
router.get("/overview", getOverviewStats);

// -------------------------------------------------------------
// USERS & ROLES
// -------------------------------------------------------------
router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// -------------------------------------------------------------
// ROOMS & BUILDINGS
// -------------------------------------------------------------
router.post("/rooms", createRoom);
router.patch("/rooms/:id", updateRoom);
router.delete("/rooms/:id", deleteRoom);

// -------------------------------------------------------------
// TIMETABLE & CSV IMPORT
// -------------------------------------------------------------
router.get("/timetable", listTimetable);
router.post("/timetable", createTimetableEntry);
router.patch("/timetable/:id", updateTimetableEntry);
router.delete("/timetable/:id", deleteTimetableEntry);
router.post("/timetable/upload", upload.single("file"), uploadTimetableCsv);

// -------------------------------------------------------------
// LOST & FOUND MODERATION
// -------------------------------------------------------------
router.get("/lost-found", listAllLostFound);
router.patch("/lost-found/:id/status", adminUpdateLostFoundStatus);
router.delete("/lost-found/:id", adminDeleteLostFound);

// -------------------------------------------------------------
// CHAT SAFETY & AUDIT
// -------------------------------------------------------------
router.get("/chats/threads", listAllChatThreads);
router.get("/chats/history/:user1Id/:user2Id", getChatThreadHistory);

module.exports = router;
