const LostFoundItem = require('../models/LostFoundItem');

// GET /api/lost-found?q=&type=&category=&status=
const getItems = async (req, res) => {
  try {
    const { q, type, category, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const items = await LostFoundItem.find(filter)
      .populate('reportedBy', 'name email usn role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lost-found/:id
const getItemById = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id).populate(
      'reportedBy',
      'name email usn role'
    );
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lost-found (multipart: image)
const createItem = async (req, res) => {
  try {
    const { title, description, type, category, location, locationFound, date } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl || '';
    const item = await LostFoundItem.create({
      title,
      description,
      type,
      category,
      location: location || locationFound || '',
      locationFound: locationFound || location || '',
      date: date || Date.now(),
      imageUrl,
      reportedBy: req.user._id,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lost-found/:id/claim
const claimItem = async (req, res) => {
  try {
    const { claimProof } = req.body;
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.claimantId = req.user._id;
    item.claimProof = claimProof || '';
    item.status = 'claimed';
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/lost-found/:id/status
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only reporter or admin can update status' });
    }
    item.status = status;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lost-found/:id
const deleteItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    const isOwner = item.reportedBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only reporter or admin can delete' });
    }
    await item.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getItems, getItemById, createItem, claimItem, updateStatus, deleteItem };
