const express = require('express');
const { protect } = require('../middleware/auth');
const { getConversations, getHistory } = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/history/:otherUserId', protect, getHistory);

module.exports = router;
