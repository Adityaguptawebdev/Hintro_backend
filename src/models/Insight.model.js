const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema(
  {
    quote: { type: String, required: true },
    speaker: { type: String },
    startTime: { type: Number },
    segmentIndex: { type: Number },
  },
  { _id: false }
);

const insightSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['summary', 'key_decision', 'risk', 'opportunity', 'sentiment', 'followup'],
      required: true,
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    citations: [citationSchema],
    confidence: { type: Number, min: 0, max: 1 },
    aiProvider: { type: String, enum: ['openai', 'gemini'] },
    aiModel: { type: String },
    generatedAt: { type: Date, default: Date.now },
    isUserEdited: { type: Boolean, default: false },
    userEditedAt: { type: Date },
  },
  { timestamps: true }
);

insightSchema.index({ meeting: 1, type: 1 });
insightSchema.index({ owner: 1 });

module.exports = mongoose.model('Insight', insightSchema);
