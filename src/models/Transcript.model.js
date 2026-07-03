const mongoose = require('mongoose');

const segmentSchema = new mongoose.Schema(
  {
    speaker: { type: String, required: true },
    text: { type: String, required: true },
    startTime: { type: Number, comment: 'seconds' },
    endTime: { type: Number },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const transcriptSchema = new mongoose.Schema(
  {
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rawText: { type: String, required: true },
    segments: [segmentSchema],
    wordCount: { type: Number },
    language: { type: String, default: 'en' },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingError: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

transcriptSchema.pre('save', function (next) {
  if (this.isModified('rawText')) {
    this.wordCount = this.rawText.split(/\s+/).filter(Boolean).length;
  }
  next();
});

transcriptSchema.index({ owner: 1 });
transcriptSchema.index({ processingStatus: 1 });

module.exports = mongoose.model('Transcript', transcriptSchema);
