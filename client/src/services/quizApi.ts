import axiosInstance from '../api/axiosInstance';

export interface QuizOption {
  optionId: string;
  text: string;
}

export interface QuizQuestionDto {
  _id: string;
  prompt: string;
  options: QuizOption[];
  order: number;
  correctOptionId?: string;
}

export interface QuizDto {
  _id: string;
  lessonId: string;
  courseId: string;
  title: string;
  passThresholdPercent: number;
  maxAttempts: number;
  questions: QuizQuestionDto[];
}

export interface QuizAttemptDto {
  _id: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  percent: number;
  passed: boolean;
  submittedAt: string;
}

function apiError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function getQuizForLesson(lessonId: string): Promise<QuizDto> {
  const { data } = await axiosInstance.get(`/lessons/${lessonId}/quiz`);
  if (!data?.success) throw new Error(data?.message || 'Quiz not found');
  return data.data;
}

export async function createQuizForLesson(
  lessonId: string,
  input?: { title?: string; passThresholdPercent?: number; maxAttempts?: number },
): Promise<QuizDto> {
  try {
    const { data } = await axiosInstance.post(`/lessons/${lessonId}/quiz`, input ?? {});
    if (!data?.success) throw new Error(data?.message || 'Unable to create quiz');
    return data.data;
  } catch (err) {
    throw new Error(apiError(err, 'Unable to create quiz'));
  }
}

export async function addQuizQuestion(
  quizId: string,
  input: {
    prompt: string;
    options: QuizOption[];
    correctOptionId: string;
    order: number;
  },
): Promise<QuizQuestionDto> {
  try {
    const { data } = await axiosInstance.post(`/quizzes/${quizId}/questions`, input);
    if (!data?.success) throw new Error(data?.message || 'Unable to add question');
    return data.data;
  } catch (err) {
    throw new Error(apiError(err, 'Unable to add question'));
  }
}

export async function deleteQuizQuestion(questionId: string): Promise<void> {
  try {
    const { data } = await axiosInstance.delete(`/questions/${questionId}`);
    if (!data?.success) throw new Error(data?.message || 'Unable to delete question');
  } catch (err) {
    throw new Error(apiError(err, 'Unable to delete question'));
  }
}

export async function submitQuizAttempt(
  quizId: string,
  answers: Array<{ questionId: string; optionId: string }>,
): Promise<QuizAttemptDto> {
  try {
    const { data } = await axiosInstance.post(`/quizzes/${quizId}/attempts`, { answers });
    if (!data?.success) throw new Error(data?.message || 'Unable to submit attempt');
    return data.data;
  } catch (err) {
    throw new Error(apiError(err, 'Unable to submit attempt'));
  }
}

export async function listMyQuizAttempts(quizId: string): Promise<QuizAttemptDto[]> {
  const { data } = await axiosInstance.get(`/quizzes/${quizId}/attempts`);
  if (!data?.success) throw new Error(data?.message || 'Unable to load attempts');
  return data.data;
}
