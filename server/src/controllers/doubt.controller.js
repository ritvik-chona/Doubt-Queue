import Doubt from '../models/Doubt.js';
import { HttpError } from '../middleware/errorHandler.js';

const SORTS = {
  votes: { upvoteCount: -1, createdAt: -1, _id: -1 },
  new: { createdAt: -1, _id: -1 },
};

const PEOPLE = [
  { path: 'author', select: 'name role' },
  { path: 'claimedBy', select: 'name' },
];

export async function createDoubt(req, res) {
  const { title, body, tags } = req.body;
  const doubt = await Doubt.create({
    course: req.course._id,
    author: req.user._id,
    title,
    body,
    tags,
  });
  await doubt.populate(PEOPLE);
  res.status(201).json({ doubt: { ...doubt.toJSON(), hasUpvoted: false } });
}

export async function listDoubts(req, res) {
  const { search, status, sort, page, limit } = req.validatedQuery;

  const filter = { course: req.course._id };
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search };

  const [doubts, total] = await Promise.all([
    Doubt.find(filter)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(PEOPLE),
    Doubt.countDocuments(filter),
  ]);

  // One extra indexed query instead of shipping every voter id to the client.
  const upvotedIds = await Doubt.find({
    _id: { $in: doubts.map((d) => d._id) },
    upvotes: req.user._id,
  }).distinct('_id');
  const upvoted = new Set(upvotedIds.map(String));

  res.json({
    doubts: doubts.map((d) => ({ ...d.toJSON(), hasUpvoted: upvoted.has(String(d._id)) })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function toggleUpvote(req, res) {
  const doubtId = req.doubt._id;
  const userId = req.user._id;

  if (req.doubt.author.equals(userId)) {
    throw new HttpError(403, 'You cannot upvote your own doubt');
  }

  // Each update is atomic and guarded by its filter, so the vote array and the
  // counter always change together and a user can never be counted twice.
  const projection = { upvoteCount: 1 };
  let doubt = await Doubt.findOneAndUpdate(
    { _id: doubtId, upvotes: { $ne: userId } },
    { $addToSet: { upvotes: userId }, $inc: { upvoteCount: 1 } },
    { returnDocument: 'after', projection }
  );
  if (doubt) return res.json({ upvoted: true, upvoteCount: doubt.upvoteCount });

  doubt = await Doubt.findOneAndUpdate(
    { _id: doubtId, upvotes: userId },
    { $pull: { upvotes: userId }, $inc: { upvoteCount: -1 } },
    { returnDocument: 'after', projection }
  );
  if (doubt) return res.json({ upvoted: false, upvoteCount: doubt.upvoteCount });

  // Neither matched: the doubt was deleted between loading and updating.
  throw new HttpError(404, 'Doubt not found');
}
