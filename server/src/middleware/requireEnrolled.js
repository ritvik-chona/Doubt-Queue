import mongoose from 'mongoose';
import Course from '../models/Course.js';
import { HttpError } from './errorHandler.js';

export function isCourseMember(course, userId) {
  return course.owner.equals(userId) || course.members.some((m) => m.equals(userId));
}

// Use after auth on routes with :id or :courseId. Attaches the course as req.course.
export async function requireEnrolled(req, res, next) {
  const courseId = req.params.courseId ?? req.params.id;
  if (!mongoose.isValidObjectId(courseId)) throw new HttpError(400, 'Invalid course id');

  const course = await Course.findById(courseId);
  if (!course) throw new HttpError(404, 'Course not found');
  if (!isCourseMember(course, req.user._id)) {
    throw new HttpError(403, 'You are not enrolled in this course');
  }

  req.course = course;
  next();
}
