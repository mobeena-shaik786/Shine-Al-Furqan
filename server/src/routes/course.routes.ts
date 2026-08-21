import { Request, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as academic from '../services/academic.service';
import { sendSuccess } from '../utils/apiResponse';
import {
  createCourseSchema, createLessonSchema, createModuleSchema, listCoursesQuerySchema,
  updateCourseSchema, updateCourseStatusSchema, updateLessonSchema, updateModuleSchema,
  updateProgressSchema,
} from '../validators/academic.validator';

const router = Router();
const actor = (req: Request): academic.AcademicActor => ({ id: req.user!.id, role: req.user!.role });

router.use(protect);
router.get('/', async (req, res, next) => {
  try {
    const result = await academic.listCourses(actor(req), listCoursesQuerySchema.parse(req.query));
    sendSuccess(res, result.courses, 'Courses retrieved', 200, result.meta);
  } catch (error) { next(error); }
});
router.post('/', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try { sendSuccess(res, academic.toCourseDto(await academic.createCourse(createCourseSchema.parse(req.body), req.user!.id)), 'Course created', 201); } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => {
  try { sendSuccess(res, await academic.getCourse(actor(req), req.params.id), 'Course retrieved'); } catch (error) { next(error); }
});
router.patch('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try { sendSuccess(res, await academic.updateCourse(actor(req), req.params.id, updateCourseSchema.parse(req.body)), 'Course updated'); } catch (error) { next(error); }
});
router.patch('/:id/status', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try { sendSuccess(res, await academic.updateCourseStatus(actor(req), req.params.id, updateCourseStatusSchema.parse(req.body).status), 'Course status updated'); } catch (error) { next(error); }
});
router.delete('/:id', authorizeRoles('admin', 'coordinator'), async (req, res, next) => {
  try { await academic.deleteCourse(actor(req), req.params.id); sendSuccess(res, null, 'Course deleted'); } catch (error) { next(error); }
});
router.get('/:courseId/modules', async (req, res, next) => {
  try { sendSuccess(res, await academic.listModules(actor(req), req.params.courseId), 'Modules retrieved'); } catch (error) { next(error); }
});
router.post('/:courseId/modules', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try { sendSuccess(res, await academic.createModuleForCourse(actor(req), req.params.courseId, createModuleSchema.omit({ courseId: true }).parse(req.body)), 'Module created', 201); } catch (error) { next(error); }
});
router.get('/:courseId/lessons', async (req, res, next) => {
  try { sendSuccess(res, await academic.listLessons(actor(req), req.params.courseId), 'Lessons retrieved'); } catch (error) { next(error); }
});
router.get('/:id/progress', authorizeRoles('student'), async (req, res, next) => {
  try { sendSuccess(res, await academic.getCourseProgress(req.user!.id, req.params.id), 'Course progress retrieved'); } catch (error) { next(error); }
});

export const moduleRouter = Router();
moduleRouter.use(protect, authorizeRoles('admin', 'coordinator', 'ustad'));
moduleRouter.patch('/:id', async (req, res, next) => {
  try { sendSuccess(res, await academic.updateModule(actor(req), req.params.id, updateModuleSchema.parse(req.body)), 'Module updated'); } catch (error) { next(error); }
});
moduleRouter.post('/:moduleId/reorder', async (req, res, next) => {
  try { sendSuccess(res, await academic.updateModule(actor(req), req.params.moduleId, { order: createModuleSchema.shape.order.parse(req.body.order) }), 'Module reordered'); } catch (error) { next(error); }
});
moduleRouter.delete('/:id', async (req, res, next) => {
  try { await academic.deleteModule(actor(req), req.params.id); sendSuccess(res, null, 'Module deleted'); } catch (error) { next(error); }
});
moduleRouter.post('/:moduleId/lessons', async (req, res, next) => {
  try { sendSuccess(res, await academic.createLessonForModule(actor(req), req.params.moduleId, createLessonSchema.omit({ courseId: true, moduleId: true }).parse(req.body)), 'Lesson created', 201); } catch (error) { next(error); }
});

export const lessonRouter = Router();
lessonRouter.use(protect);
lessonRouter.post('/:id/progress', authorizeRoles('student'), async (req, res, next) => {
  try { sendSuccess(res, await academic.updateLessonProgress(req.user!.id, req.params.id, updateProgressSchema.parse(req.body).completed), 'Lesson progress updated'); } catch (error) { next(error); }
});
lessonRouter.patch('/:id', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try { sendSuccess(res, await academic.updateLesson(actor(req), req.params.id, updateLessonSchema.parse(req.body)), 'Lesson updated'); } catch (error) { next(error); }
});
lessonRouter.delete('/:id', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try { await academic.deleteLesson(actor(req), req.params.id); sendSuccess(res, null, 'Lesson deleted'); } catch (error) { next(error); }
});

export default router;
