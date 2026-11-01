const LostFoundItem = require('../models/LostFoundItem');

// Repository = data-access only. No business rules, no HTTP.
const find = (filter = {}, options = {}) => {
  const query = LostFoundItem.find(filter)
    .populate('reportedBy', 'name email usn role')
    .sort(options.sort || { createdAt: -1 });

  if (options.limit) {
    query.limit(options.limit);
  } else {
    query.limit(100);
  }

  return query;
};

const findById = (id) => {
  return LostFoundItem.findById(id).populate('reportedBy', 'name email usn role');
};

const create = (data) => {
  return LostFoundItem.create(data);
};

const save = (doc) => {
  return doc.save();
};

const deleteById = (id) => {
  return LostFoundItem.findByIdAndDelete(id);
};

module.exports = {
  find,
  findById,
  create,
  save,
  deleteById,
};
