import { Request, Router } from 'express';
import { authorizeRoles, protect } from '../middleware/auth';
import * as quiz from '../services/quiz.service';
import { sendSuccess } from '../utils/apiResponse';
import { createQuizSchema, quizQuestionSchema, submitAttemptSchema, updateQuizQuestionSchema } from '../validators/quiz.validator';
import type { AcademicActor } from '../services/academic.service';

const router = Router();
const actor = (req: Request): AcademicActor => ({ id: req.user!.id, role: req.user!.role });
router.use(protect);
router.post('/', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => {
  try { const input = createQuizSchema.parse(req.body); sendSuccess(res, await quiz.createQuizForLesson(actor(req), input.lessonId, input), 'Quiz created', 201); } catch (error) { next(error); }
});
router.get('/:id', async (req, res, next) => { try { sendSuccess(res, await quiz.getQuizForActor(actor(req), req.params.id), 'Quiz retrieved'); } catch (error) { next(error); } });
router.post('/:id/questions', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => { try { sendSuccess(res, await quiz.addQuestion(actor(req), req.params.id, quizQuestionSchema.parse(req.body)), 'Question added', 201); } catch (error) { next(error); } });
router.post('/:id/attempts', authorizeRoles('student'), async (req, res, next) => { try { sendSuccess(res, await quiz.submitAttempt(req.user!.id, req.params.id, submitAttemptSchema.parse(req.body).answers), 'Quiz attempt submitted', 201); } catch (error) { next(error); } });
router.get('/:id/attempts', authorizeRoles('student'), async (req, res, next) => { try { sendSuccess(res, await quiz.listMyAttempts(req.user!.id, req.params.id), 'Quiz attempts retrieved'); } catch (error) { next(error); } });
export const questionRouter = Router();
questionRouter.use(protect, authorizeRoles('admin', 'coordinator', 'ustad'));
questionRouter.patch('/:id', async (req, res, next) => { try { sendSuccess(res, await quiz.updateQuestion(actor(req), req.params.id, updateQuizQuestionSchema.parse(req.body)), 'Question updated'); } catch (error) { next(error); } });
questionRouter.delete('/:id', async (req, res, next) => { try { await quiz.deleteQuestion(actor(req), req.params.id); sendSuccess(res, null, 'Question deleted'); } catch (error) { next(error); } });
export const lessonQuizRouter = Router();
lessonQuizRouter.use(protect);
lessonQuizRouter.post('/:lessonId/quiz', authorizeRoles('admin', 'coordinator', 'ustad'), async (req, res, next) => { try { const input = createQuizSchema.omit({ lessonId: true }).parse(req.body); sendSuccess(res, await quiz.createQuizForLesson(actor(req), req.params.lessonId, input), 'Quiz created', 201); } catch (error) { next(error); } });
lessonQuizRouter.get('/:lessonId/quiz', async (req, res, next) => { try { sendSuccess(res, await quiz.getQuizForActor(actor(req), req.params.lessonId), 'Quiz retrieved'); } catch (error) { next(error); } });
export default router;
