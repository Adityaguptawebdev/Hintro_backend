const User = require('../../../models/User.model');

const findByEmail = (email) => User.findOne({ email }).select('+password');
const findById = (id) => User.findById(id);
const findByAuth0Id = (auth0Id) => User.findOne({ auth0Id });
const create = (data) => User.create(data);
const updateById = (id, data) => User.findByIdAndUpdate(id, data, { new: true });

module.exports = { findByEmail, findById, findByAuth0Id, create, updateById };
