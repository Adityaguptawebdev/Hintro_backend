const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { authConfig } = require('../config/app.config');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false, minlength: 8 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    integrations: {
      telegram: { chatId: String, isConnected: { type: Boolean, default: false } },
      slack: { userId: String, channelId: String, isConnected: { type: Boolean, default: false } },
    },
    preferences: {
      reminderLeadTimeHours: { type: Number, default: 24 },
      notifyViaEmail: { type: Boolean, default: true },
      notifyViaTelegram: { type: Boolean, default: false },
      notifyViaSlack: { type: Boolean, default: false },
      timezone: { type: String, default: 'UTC' },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, authConfig.bcryptRounds);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
