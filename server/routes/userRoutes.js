const express = require('express');
const { search } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// People directory for 1-on-1 chat
router.get('/', protect, search);

module.exports = router;
