import Answer from '../models/Answer.js';
import Doubt from '../models/Doubt.js';
import { HttpError } from '../middleware/errorHandler.js';
import { TRANSITIONS, transition, getPermissions } from '../services/doubtStateMachine.js';
import { PEOPLE } from './doubt.controller.js';

// Full doubt view used by GET /doubts/:id and returned after every action, so
// the client can re-render without a second request.
async function buildDetail(doubt, user) {
  const [answers, hasUpvoted] = await Promise.all([
    Answer.find({ doubt: doubt._id })
      .sort({ createdAt: 1, _id: 1 })
      .populate('author', 'name role'),
    Doubt.exists({ _id: doubt._id, upvotes: user._id }),
  ]);

  const permissions = getPermissions(
    {
      status: doubt.status,
      authorId: String(doubt.author._id),
      claimedById: doubt.claimedBy ? String(doubt.claimedBy._id) : null,
      answerCount: answers.length,
    },
    { userId: String(user._id), role: user.role }
  );

  return { doubt: { ...doubt.toJSON(), hasUpvoted: Boolean(hasUpvoted), permissions }, answers };
}

// Builds the 409 from the doubt's current state, re-read so the message is accurate
// even when another TA changed it a moment ago.
async function conflictError(doubtId, action, userId) {
  const doubt = await Doubt.findById(doubtId).populate('claimedBy', 'name');
  if (!doubt) return new HttpError(404, 'Doubt not found');

  if (action === 'claim' && doubt.status === 'claimed') {
    if (doubt.claimedBy?._id.equals(userId)) {
      return new HttpError(409, 'You have already claimed this doubt');
    }
    return new HttpError(409, `Already claimed by ${doubt.claimedBy?.name ?? 'another TA'}`);
  }

  const { error } = transition(doubt.status, action);
  return new HttpError(409, error ?? 'This doubt was just updated by someone else, please refresh');
}

// Checks the move against the state machine, then applies it with one atomic update
// that only matches if the doubt is still in the expected state (plus any extra match).
async function applyTransition(req, action, { match = {}, set = {} } = {}) {
  const { error, status } = transition(req.doubt.status, action);
  if (error) throw await conflictError(req.doubt._id, action, req.user._id);

  const doubt = await Doubt.findOneAndUpdate(
    { _id: req.doubt._id, status: TRANSITIONS[action].from, ...match },
    { $set: { status, ...set } },
    { returnDocument: 'after' }
  ).populate(PEOPLE);

  if (!doubt) throw await conflictError(req.doubt._id, action, req.user._id);
  return doubt;
}

// While a doubt is claimed, only the claiming TA may work on it. For any other
// status the state machine produces the 409 instead.
function assertClaimer(req, verb) {
  const { status, claimedBy } = req.doubt;
  if (status === 'claimed' && !claimedBy?.equals(req.user._id)) {
    throw new HttpError(403, `Only the TA who claimed this doubt can ${verb} it`);
  }
}

export async function getDoubt(req, res) {
  await req.doubt.populate(PEOPLE);
  res.json(await buildDetail(req.doubt, req.user));
}

export async function claimDoubt(req, res) {
  const doubt = await applyTransition(req, 'claim', { set: { claimedBy: req.user._id } });
  res.json(await buildDetail(doubt, req.user));
}

export async function unclaimDoubt(req, res) {
  assertClaimer(req, 'unclaim');
  const doubt = await applyTransition(req, 'unclaim', {
    match: { claimedBy: req.user._id },
    set: { claimedBy: null },
  });
  res.json(await buildDetail(doubt, req.user));
}

export async function addAnswer(req, res) {
  assertClaimer(req, 'answer');
  if (req.doubt.status !== 'claimed') {
    throw new HttpError(409, 'Claim this doubt before answering it');
  }

  await Answer.create({ doubt: req.doubt._id, author: req.user._id, body: req.body.body });
  await req.doubt.populate(PEOPLE);
  res.status(201).json(await buildDetail(req.doubt, req.user));
}

export async function resolveDoubt(req, res) {
  assertClaimer(req, 'resolve');
  const { error } = transition(req.doubt.status, 'resolve');
  if (error) throw await conflictError(req.doubt._id, 'resolve', req.user._id);

  if (!(await Answer.exists({ doubt: req.doubt._id }))) {
    throw new HttpError(409, 'Post an answer before resolving this doubt');
  }

  const doubt = await applyTransition(req, 'resolve', { match: { claimedBy: req.user._id } });
  res.json(await buildDetail(doubt, req.user));
}

export async function reopenDoubt(req, res) {
  if (!req.doubt.author.equals(req.user._id)) {
    throw new HttpError(403, 'Only the author can reopen this doubt');
  }
  // Answers are kept so the next TA can see what was already tried.
  const doubt = await applyTransition(req, 'reopen', { set: { claimedBy: null } });
  res.json(await buildDetail(doubt, req.user));
}
