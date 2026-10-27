import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    doubt: { type: mongoose.Schema.Types.ObjectId, ref: 'Doubt', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Answer', answerSchema);
