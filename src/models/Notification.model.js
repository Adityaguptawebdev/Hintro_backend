const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['meeting_reminder', 'action_item_due', 'action_item_overdue', 'insight_ready', 'transcript_processed'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    relatedMeeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    relatedActionItem: { type: mongoose.Schema.Types.ObjectId, ref: 'ActionItem' },
    channels: {
      inApp: { sent: Boolean, sentAt: Date },
      telegram: { sent: Boolean, sentAt: Date, messageId: String },
      slack: { sent: Boolean, sentAt: Date, messageTs: String },
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
