const mongoose = require('mongoose');

const actionItemSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    assignee: {
      name: { type: String },
      email: { type: String },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    isOverdue: { type: Boolean, default: false },
    overdueDetectedAt: { type: Date },
    sourceQuote: { type: String, comment: 'verbatim transcript excerpt that generated this item' },
    reminderSentAt: { type: Date },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

actionItemSchema.index({ owner: 1, status: 1 });
actionItemSchema.index({ meeting: 1 });
actionItemSchema.index({ dueDate: 1, isOverdue: 1 });
actionItemSchema.index({ 'assignee.userId': 1 });

module.exports = mongoose.model('ActionItem', actionItemSchema);
