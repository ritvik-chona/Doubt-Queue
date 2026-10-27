import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Doubt from '../models/Doubt.js';
import { HttpError } from './errorHandler.js';
import { isCourseMember } from './requireEnrolled.js';

// Use after auth on /api/doubts/:id routes. Attaches req.doubt and req.course.
// Outsiders get the same 404 as a missing doubt, so ids can't be probed.
export async function loadDoubt(req, res, next) {
  const notFound = new HttpError(404, 'Doubt not found');
  if (!mongoose.isValidObjectId(req.params.id)) throw notFound;

  const doubt = await Doubt.findById(req.params.id);
  if (!doubt) throw notFound;

  const course = await Course.findById(doubt.course);
  if (!course || !isCourseMember(course, req.user._id)) throw notFound;

  req.doubt = doubt;
  req.course = course;
  next();
}
