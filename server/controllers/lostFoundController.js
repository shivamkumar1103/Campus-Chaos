// Thin HTTP layer — delegates to lostFoundService. No DB calls here.
const lostFoundService = require('../services/lostFoundService');
const catchAsync = require('../utils/catchAsync');

// GET /api/lost-found?q=&type=&category=&status=
const getItems = catchAsync(async (req, res, next) => {
  const { q, type, category, status } = req.query;
  const items = await lostFoundService.getItems({ q, type, category, status });
  res.json(items);
});

// GET /api/lost-found/:id
const getItemById = catchAsync(async (req, res, next) => {
  const item = await lostFoundService.getItemById(req.params.id);
  res.json(item);
});

// POST /api/lost-found (multipart: image)
const createItem = catchAsync(async (req, res, next) => {
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
  req.app.get('io')?.emit('admin_stats_changed');
  res.status(201).json(item);
});

// POST /api/lost-found/:id/claim
const claimItem = catchAsync(async (req, res, next) => {
  const { claimProof } = req.body;
  const item = await lostFoundService.claimItem(req.params.id, req.user._id, claimProof);
  req.app.get('io')?.emit('admin_stats_changed');
  res.json(item);
});

// PATCH /api/lost-found/:id/status
const updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const item = await lostFoundService.updateStatus(req.params.id, req.user, status);
  req.app.get('io')?.emit('admin_stats_changed');
  res.json(item);
});

// DELETE /api/lost-found/:id
const deleteItem = catchAsync(async (req, res, next) => {
  const result = await lostFoundService.deleteItem(req.params.id, req.user);
  req.app.get('io')?.emit('admin_stats_changed');
  res.json(result);
});

module.exports = {
  getItems,
  getItemById,
  createItem,
  claimItem,
  updateStatus,
  deleteItem,
};
