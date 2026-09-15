const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  getItems,
  getItemById,
  createItem,
  claimItem,
  updateStatus,
  deleteItem,
} = require('../controllers/lostFoundController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'upload').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', protect, upload.single('image'), createItem);
router.post('/:id/claim', protect, claimItem);
router.patch('/:id/status', protect, updateStatus);
router.delete('/:id', protect, deleteItem);

module.exports = router;
