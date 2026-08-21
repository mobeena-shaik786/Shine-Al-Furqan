import { Types } from 'mongoose';
import { Enrollment, Lesson, Quiz, QuizAttempt, QuizQuestion } from '../models/academic';
import { AppError } from '../utils/AppError';
import { canManageCourse, type AcademicActor } from './academic.service';
import { Course } from '../models/academic/Course';
import { quizQuestionSchema, type CreateQuizInput, type QuizQuestionInput, type UpdateQuizQuestionInput } from '../validators/quiz.validator';

const staff = (actor: AcademicActor) => actor.role !== 'student';
async function quizOrThrow(id: string) {
  const quiz = await Quiz.findById(id);
  if (!quiz) throw new AppError('Quiz not found', 404);
  return quiz;
}
async function assertManager(actor: AcademicActor, courseId: string) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (!staff(actor) || !canManageCourse(actor, course)) throw new AppError('You do not have permission to manage this quiz', 403);
  return course;
}
function questionDto(question: import('../models/academic').IQuizQuestion, revealAnswer: boolean) {
  return { _id: String(question._id), prompt: question.prompt, options: question.options, order: question.order, ...(revealAnswer ? { correctOptionId: question.correctOptionId } : {}) };
}
function quizDto(quiz: import('../models/academic').IQuiz, questions: import('../models/academic').IQuizQuestion[], revealAnswers: boolean) {
  return { _id: String(quiz._id), lessonId: String(quiz.lesson), courseId: String(quiz.course), title: quiz.title, passThresholdPercent: quiz.passThresholdPercent, maxAttempts: quiz.maxAttempts, questions: questions.map((question) => questionDto(question, revealAnswers)) };
}
export async function createQuizForLesson(actor: AcademicActor, lessonId: string, raw: Omit<CreateQuizInput, 'lessonId'>) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await assertManager(actor, String(lesson.course));
  const input = raw;
  try {
    const quiz = await Quiz.create({ lesson: lesson._id, course: lesson.course, title: input.title ?? lesson.title, passThresholdPercent: input.passThresholdPercent ?? 70, maxAttempts: input.maxAttempts ?? 0, createdBy: actor.id });
    if (lesson.lessonType !== 'quiz') { lesson.lessonType = 'quiz'; await lesson.save(); }
    return quizDto(quiz, [], true);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw new AppError('A quiz already exists for this lesson', 409);
    throw error;
  }
}
export async function getQuizForActor(actor: AcademicActor, idOrLessonId: string) {
  const quiz = await Quiz.findById(idOrLessonId) ?? await Quiz.findOne({ lesson: idOrLessonId });
  if (!quiz) throw new AppError('Quiz not found', 404);
  const course = await Course.findById(quiz.course);
  if (!course) throw new AppError('Course not found', 404);
  const reveal = canManageCourse(actor, course);
  if (!reveal && !(actor.role === 'student' && course.status === 'published' && await Enrollment.exists({ student: actor.id, course: quiz.course, status: 'active' }))) throw new AppError('You do not have permission to view this quiz', 403);
  return quizDto(quiz, await QuizQuestion.find({ quiz: quiz._id }).sort('order'), reveal);
}
export async function addQuestion(actor: AcademicActor, quizId: string, input: QuizQuestionInput) {
  const quiz = await quizOrThrow(quizId); await assertManager(actor, String(quiz.course));
  return questionDto(await QuizQuestion.create({ ...input, quiz: quiz._id }), true);
}
export async function updateQuestion(actor: AcademicActor, questionId: string, input: UpdateQuizQuestionInput) {
  const question = await QuizQuestion.findById(questionId); if (!question) throw new AppError('Quiz question not found', 404);
  const quiz = await quizOrThrow(String(question.quiz)); await assertManager(actor, String(quiz.course));
  const validated = quizQuestionSchema.parse({ prompt: input.prompt ?? question.prompt, options: input.options ?? question.options, correctOptionId: input.correctOptionId ?? question.correctOptionId, order: input.order ?? question.order });
  Object.assign(question, validated); await question.save(); return questionDto(question, true);
}
export async function deleteQuestion(actor: AcademicActor, questionId: string) {
  const question = await QuizQuestion.findById(questionId); if (!question) throw new AppError('Quiz question not found', 404);
  const quiz = await quizOrThrow(String(question.quiz)); await assertManager(actor, String(quiz.course)); await question.deleteOne();
}
export async function submitAttempt(studentId: string, quizId: string, answers: Array<{ questionId: string; optionId: string }>) {
  const quiz = await quizOrThrow(quizId);
  const lesson = await Lesson.findById(quiz.lesson);
  if (!lesson || lesson.status !== 'published') throw new AppError('Quiz lesson is not published', 403);
  if (!await Enrollment.exists({ student: studentId, course: quiz.course, status: 'active' })) throw new AppError('Active enrollment is required', 403);
  if (quiz.maxAttempts > 0 && await QuizAttempt.countDocuments({ quiz: quiz._id, student: studentId }) >= quiz.maxAttempts) throw new AppError('Maximum quiz attempts reached', 409);
  const questions = await QuizQuestion.find({ quiz: quiz._id }).sort('order');
  if (!questions.length) throw new AppError('Quiz has no questions', 400);
  if (answers.length !== questions.length || new Set(answers.map((answer) => answer.questionId)).size !== questions.length) throw new AppError('Every quiz question must be answered exactly once', 400);
  const answersByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.optionId]));
  for (const question of questions) {
    const answer = answersByQuestion.get(String(question._id));
    if (!answer || !question.options.some((option) => option.optionId === answer)) throw new AppError('Answers contain an invalid question or option', 400);
  }
  const score = questions.filter((question) => answersByQuestion.get(String(question._id)) === question.correctOptionId).length;
  const percent = Math.round((score / questions.length) * 100);
  const attempt = await QuizAttempt.create({ quiz: quiz._id, student: new Types.ObjectId(studentId), course: quiz.course, answers: answers.map((answer) => ({ questionId: new Types.ObjectId(answer.questionId), optionId: answer.optionId })), score, totalQuestions: questions.length, percent, passed: percent >= quiz.passThresholdPercent });
  return attemptDto(attempt);
}
function attemptDto(attempt: import('../models/academic').IQuizAttempt) {
  return { _id: String(attempt._id), quizId: String(attempt.quiz), score: attempt.score, totalQuestions: attempt.totalQuestions, percent: attempt.percent, passed: attempt.passed, submittedAt: attempt.submittedAt.toISOString() };
}
export async function listMyAttempts(studentId: string, quizId: string) {
  await quizOrThrow(quizId);
  return (await QuizAttempt.find({ quiz: quizId, student: studentId }).sort('-submittedAt')).map(attemptDto);
}
