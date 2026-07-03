const Joi = require('joi');

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).message('Must be a valid ObjectId');

const assigneeSchema = Joi.object({
  name: Joi.string().trim().max(100),
  email: Joi.string().email().lowercase(),
  userId: objectId,
});

const create = Joi.object({
  meetingId: objectId.required(),
  title: Joi.string().trim().min(1).max(500).required(),
  description: Joi.string().trim().max(2000),
  assignee: assigneeSchema,
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  dueDate: Joi.date().iso(),
  tags: Joi.array().items(Joi.string().trim().max(30)).max(10),
  sourceQuote: Joi.string().trim().max(1000),
});

const updateStatus = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').required(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
  meetingId: objectId,
  assignee: Joi.string().email(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical'),
  sort: Joi.string()
    .valid('dueDate', '-dueDate', 'createdAt', '-createdAt', 'priority', '-priority')
    .default('-createdAt'),
});

module.exports = { create, updateStatus, listQuery };
