const lostFoundRepository = require('../repositories/lostFoundRepository');

const getItems = async ({ q, type, category, status }) => {
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };

  return await lostFoundRepository.find(filter);
};

const getItemById = async (id) => {
  const item = await lostFoundRepository.findById(id);
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }
  return item;
};

const createItem = async ({ title, description, type, category, location, locationFound, date, imageUrl, userId }) => {
  return await lostFoundRepository.create({
    title,
    description,
    type,
    category,
    location: location || locationFound || '',
    locationFound: locationFound || location || '',
    date: date || Date.now(),
    imageUrl,
    reportedBy: userId,
  });
};

const claimItem = async (id, userId, claimProof) => {
  const item = await lostFoundRepository.findById(id);
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }

  item.claimantId = userId;
  item.claimProof = claimProof || '';
  item.status = 'claimed';
  return await lostFoundRepository.save(item);
};

const updateStatus = async (id, user, status) => {
  const item = await lostFoundRepository.findById(id);
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }

  const reporterId = item.reportedBy?._id ? item.reportedBy._id.toString() : item.reportedBy?.toString();
  const isOwner = reporterId === user._id.toString();

  if (!isOwner && user.role !== 'admin') {
    const err = new Error('Only reporter or admin can update status');
    err.statusCode = 403;
    throw err;
  }

  item.status = status;
  return await lostFoundRepository.save(item);
};

const deleteItem = async (id, user) => {
  const item = await lostFoundRepository.findById(id);
  if (!item) {
    const err = new Error('Item not found');
    err.statusCode = 404;
    throw err;
  }

  const reporterId = item.reportedBy?._id ? item.reportedBy._id.toString() : item.reportedBy?.toString();
  const isOwner = reporterId === user._id.toString();

  if (!isOwner && user.role !== 'admin') {
    const err = new Error('Only reporter or admin can delete');
    err.statusCode = 403;
    throw err;
  }

  await item.deleteOne();
  return { message: 'Deleted' };
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  claimItem,
  updateStatus,
  deleteItem,
};
