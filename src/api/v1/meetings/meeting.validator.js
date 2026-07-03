const Joi = require('joi');

const create = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(2000),
  scheduledAt: Joi.date().iso().required(),
  duration: Joi.number().integer().min(5).max(480),
  platform: Joi.string().valid('zoom', 'google_meet', 'teams', 'other').default('other'),
  meetingUrl: Joi.string().uri().allow(''),
  participants: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email(),
      role: Joi.string().valid('host', 'attendee', 'guest').default('attendee'),
    })
  ),
  tags: Joi.array().items(Joi.string().max(30)).max(10),
  isRecurring: Joi.boolean().default(false),
  recurringPattern: Joi.string().when('isRecurring', { is: true, then: Joi.required() }),
});

const update = create.fork(['title', 'scheduledAt'], (schema) => schema.optional()).append({
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled'),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled'),
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref('from')),
  search: Joi.string().max(100),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
  sort: Joi.string().valid('scheduledAt', '-scheduledAt', 'title', '-title').default('-scheduledAt'),
});

module.exports = { create, update, listQuery };
