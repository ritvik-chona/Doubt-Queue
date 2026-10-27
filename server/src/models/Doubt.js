import mongoose from 'mongoose';

export const DOUBT_STATUSES = ['open', 'claimed', 'resolved'];

const doubtSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    status: { type: String, enum: DOUBT_STATUSES, default: 'open' },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // upvotes holds voter ids (one vote per user); upvoteCount is kept in sync for sorting.
    upvotes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], select: false },
    upvoteCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

doubtSchema.index({ title: 'text', body: 'text' }, { weights: { title: 3, body: 1 } });
doubtSchema.index({ course: 1, status: 1, upvoteCount: -1 });
doubtSchema.index({ course: 1, createdAt: -1 });

export default mongoose.model('Doubt', doubtSchema);
