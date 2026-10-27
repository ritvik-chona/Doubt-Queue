import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    doubt: { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
  },
  { timestamps: true }
);

// Answers are always fetched per doubt, oldest first.
answerSchema.index({ doubt: 1, createdAt: 1 });

answerSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Answer', answerSchema);
