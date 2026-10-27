import { Router } from 'express';
import { z } from 'zod';
import { createDoubt, listDoubts, toggleUpvote } from '../controllers/doubt.controller.js';
import {
  getDoubt,
  claimDoubt,
  unclaimDoubt,
  addAnswer,
  resolveDoubt,
  reopenDoubt,
} from '../controllers/resolution.controller.js';
import { auth } from '../middleware/auth.js';
import { loadDoubt } from '../middleware/loadDoubt.js';
import { requireEnrolled } from '../middleware/requireEnrolled.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import { DOUBT_STATUSES, MAX_TAGS } from '../models/Doubt.js';

const createDoubtSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(150),
  body: z.string().trim().min(10, 'Details must be at least 10 characters').max(5000),
  tags: z
    .array(z.string().trim().toLowerCase().min(1).max(30))
    .max(MAX_TAGS, `At most ${MAX_TAGS} tags`)
    .default([])
    .transform((tags) => [...new Set(tags)]),
});

const listDoubtsSchema = z.object({
  search: z.string().trim().max(100).optional().transform((s) => s || undefined),
  status: z.enum(DOUBT_STATUSES).optional(),
  sort: z.enum(['votes', 'new']).default('votes'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const answerSchema = z.object({
  body: z.string().trim().min(1, 'Answer cannot be empty').max(5000),
});

// Mounted at /api/courses/:id/doubts
export const courseDoubtRouter = Router({ mergeParams: true });
courseDoubtRouter.use(auth, requireEnrolled);
courseDoubtRouter.get('/', validate(listDoubtsSchema, 'query'), listDoubts);
courseDoubtRouter.post('/', validate(createDoubtSchema), createDoubt);

// Mounted at /api/doubts. Role checks run before loadDoubt so a wrong-role
// request is rejected without revealing anything about the doubt.
export const doubtRouter = Router();
doubtRouter.use(auth);
doubtRouter.get('/:id', loadDoubt, getDoubt);
doubtRouter.post('/:id/upvote', loadDoubt, toggleUpvote);
doubtRouter.post('/:id/claim', requireRole('ta'), loadDoubt, claimDoubt);
doubtRouter.post('/:id/unclaim', requireRole('ta'), loadDoubt, unclaimDoubt);
doubtRouter.post('/:id/answers', requireRole('ta'), validate(answerSchema), loadDoubt, addAnswer);
doubtRouter.post('/:id/resolve', requireRole('ta'), loadDoubt, resolveDoubt);
doubtRouter.post('/:id/reopen', loadDoubt, reopenDoubt);
