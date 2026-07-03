const ApiError = require('../utils/ApiError');

/**
 * Validates request body/params/query against a Joi schema.
 * @param {import('joi').Schema} schema
 * @param {'body'|'params'|'query'} target
 */
const validate = (schema, target = 'body') => (req, _res, next) => {
  const { error, value } = schema.validate(req[target], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    throw ApiError.unprocessable('Validation failed', errors);
  }

  req[target] = value;
  next();
};

module.exports = { validate };
