const Joi = require('joi');

const passwordComplexity = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .message('Password must be 8-128 characters and contain at least one uppercase letter, one lowercase letter, and one number')
  .required();

const register = Joi.object({
  name: Joi.string().min(2).max(60).required(),
  email: Joi.string().email().lowercase().required(),
  password: passwordComplexity,
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshToken = Joi.object({
  refreshToken: Joi.string().required(),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordComplexity,
});

const updatePreferences = Joi.object({
  preferences: Joi.object({
    notifyViaEmail: Joi.boolean(),
    notifyViaTelegram: Joi.boolean(),
    notifyViaSlack: Joi.boolean(),
    reminderLeadTimeHours: Joi.number().valid(1, 2, 6, 12, 24, 48),
    timezone: Joi.string().max(64),
  }),
  integrations: Joi.object({
    telegram: Joi.object({
      chatId: Joi.string().allow('').max(64),
    }),
    slack: Joi.object({
      userId: Joi.string().allow('').max(64),
      channelId: Joi.string().allow('').max(64),
    }),
  }),
});

module.exports = { register, login, refreshToken, changePassword, updatePreferences };
