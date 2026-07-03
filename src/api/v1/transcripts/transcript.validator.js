const Joi = require('joi');

const segmentSchema = Joi.object({
  speaker: Joi.string().trim().max(100).required(),
  text: Joi.string().trim().max(10000).required(),
  // Accept both 'timestamp' (requirement spec) and 'startTime' (model field)
  timestamp: Joi.number().min(0),
  startTime: Joi.number().min(0),
  endTime: Joi.number().min(0),
  confidence: Joi.number().min(0).max(1),
});

const create = Joi.object({
  rawText: Joi.string().min(1).max(500000).required(),
  segments: Joi.array().items(segmentSchema).default([]),
  language: Joi.string().length(2).lowercase().default('en'),
});

module.exports = { create };
