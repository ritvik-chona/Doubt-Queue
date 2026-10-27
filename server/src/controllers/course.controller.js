import Course from '../models/Course.js';
import { HttpError } from '../middleware/errorHandler.js';
import { generateJoinCode } from '../utils/joinCode.js';

const MAX_JOIN_CODE_ATTEMPTS = 5;

// Expects owner populated with name. Only the owning TA sees the join code and
// member count; students just see the course.
function toCourseJSON(course, user) {
  const isOwner = course.owner._id.equals(user._id);
  return {
    _id: course._id,
    name: course.name,
    code: course.code,
    owner: { _id: course.owner._id, name: course.owner.name },
    isOwner,
    ...(isOwner && { joinCode: course.joinCode, memberCount: course.members.length }),
    createdAt: course.createdAt,
  };
}

export async function createCourse(req, res) {
  const { name, code } = req.body;

  // 31^6 (~887M) codes make collisions rare; the unique index catches the ones that happen.
  for (let attempt = 1; attempt <= MAX_JOIN_CODE_ATTEMPTS; attempt++) {
    try {
      const course = await Course.create({
        name,
        code,
        joinCode: generateJoinCode(),
        owner: req.user._id,
      });
      await course.populate('owner', 'name');
      return res.status(201).json({ course: toCourseJSON(course, req.user) });
    } catch (err) {
      if (err.code !== 11000 || !err.keyPattern?.joinCode) throw err;
    }
  }
  throw new HttpError(500, 'Could not generate a unique join code, please try again');
}

export async function joinCourse(req, res) {
  const { joinCode } = req.body;
  const userId = req.user._id;

  // Single atomic update: only matches if the user isn't the owner or already a member.
  // Students join as members; TAs join as co-TAs who can claim and answer doubts.
  const course = await Course.findOneAndUpdate(
    { joinCode, owner: { $ne: userId }, members: { $ne: userId } },
    { $addToSet: { members: userId } },
    { returnDocument: 'after' }
  ).populate('owner', 'name');

  if (!course) {
    const existing = await Course.findOne({ joinCode }).select('owner');
    if (!existing) throw new HttpError(404, 'No course found with that join code');
    if (existing.owner.equals(userId)) throw new HttpError(409, 'You own this course');
    throw new HttpError(409, 'You are already a member of this course');
  }

  res.json({ course: toCourseJSON(course, req.user) });
}

export async function listCourses(req, res) {
  const userId = req.user._id;
  const courses = await Course.find({ $or: [{ owner: userId }, { members: userId }] })
    .populate('owner', 'name')
    .sort({ createdAt: -1 });

  res.json({ courses: courses.map((c) => toCourseJSON(c, req.user)) });
}

export async function getCourse(req, res) {
  await req.course.populate('owner', 'name');
  res.json({ course: toCourseJSON(req.course, req.user) });
}
