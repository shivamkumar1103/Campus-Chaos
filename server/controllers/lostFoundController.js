// Thin HTTP layer — delegates to lostFoundService. No DB calls here.
const lostFoundService = require('../services/lostFoundService');

// GET /api/lost-found?q=&type=&category=&status=
const getItems = async (req, res) => {
  try {
    const { q, type, category, status } = req.query;
    const items = await lostFoundService.getItems({ q, type, category, status });
    res.json(items);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// GET /api/lost-found/:id
const getItemById = async (req, res) => {
  try {
    const item = await lostFoundService.getItemById(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// POST /api/lost-found (multipart: image)
const createItem = async (req, res) => {
  try {
    const { title, description, type, category, location, locationFound, date } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || '';
    const item = await lostFoundService.createItem({
      title,
      description,
      type,
      category,
      location,
      locationFound,
      date,
      imageUrl,
      userId: req.user._id,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// POST /api/lost-found/:id/claim
const claimItem = async (req, res) => {
  try {
    const { claimProof } = req.body;
    const item = await lostFoundService.claimItem(req.params.id, req.user._id, claimProof);
    res.json(item);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// PATCH /api/lost-found/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await lostFoundService.updateStatus(req.params.id, req.user, status);
    res.json(item);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

// DELETE /api/lost-found/:id
const deleteItem = async (req, res) => {
  try {
    const result = await lostFoundService.deleteItem(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });
  }
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  claimItem,
  updateStatus,
  deleteItem,
};
