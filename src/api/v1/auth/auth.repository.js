const User = require('../../../models/User.model');

const findByEmail = (email) => User.findOne({ email }).select('+password');
const findById = (id) => User.findById(id);
const create = (data) => User.create(data);
const updateById = (id, data) => User.findByIdAndUpdate(id, data, { new: true });

module.exports = { findByEmail, findById, create, updateById };
