import { Router } from 'express';
import { z } from 'zod';
import { createCourse, joinCourse, listCourses, getCourse } from '../controllers/course.controller.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { requireEnrolled } from '../middleware/requireEnrolled.js';
import { validate } from '../middleware/validate.js';

const createCourseSchema = z.object({
  name: z.string().trim().min(3, 'Course name must be at least 3 characters').max(120),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Course code must be at least 2 characters')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Course code may only contain letters, digits and dashes'),
});

const joinCourseSchema = z.object({
  joinCode: z.string().trim().toUpperCase().length(6, 'Join code must be 6 characters'),
});

const router = Router();

router.use(auth);

router.get('/', listCourses);
router.post('/', requireRole('ta'), validate(createCourseSchema), createCourse);
router.post('/join', validate(joinCourseSchema), joinCourse);
router.get('/:id', requireEnrolled, getCourse);

export default router;
