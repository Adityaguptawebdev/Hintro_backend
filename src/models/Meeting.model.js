const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: ['host', 'attendee', 'guest'], default: 'attendee' },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [participantSchema],
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, comment: 'minutes' },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    platform: {
      type: String,
      enum: ['zoom', 'google_meet', 'teams', 'other'],
      default: 'other',
    },
    meetingUrl: { type: String },
    tags: [{ type: String, lowercase: true, trim: true }],
    isRecurring: { type: Boolean, default: false },
    recurringPattern: { type: String },
    hasTranscript: { type: Boolean, default: false },
    hasInsights: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

meetingSchema.virtual('transcript', {
  ref: 'Transcript',
  localField: '_id',
  foreignField: 'meeting',
  justOne: true,
});

meetingSchema.virtual('actionItems', {
  ref: 'ActionItem',
  localField: '_id',
  foreignField: 'meeting',
});

meetingSchema.index({ owner: 1, scheduledAt: -1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ tags: 1 });
meetingSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Meeting', meetingSchema);
