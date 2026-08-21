import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import coordinatorRoutes from './routes/coordinator.routes';
import indexRoutes from './routes/index';
import studentRoutes from './routes/student.routes';
import ustadRoutes from './routes/ustad.routes';
import userRoutes from './routes/user.routes';
import courseRoutes, { lessonRouter, moduleRouter } from './routes/course.routes';
import { batchRouter, enrollmentRouter } from './routes/enrollment.routes';
import quizRoutes, { lessonQuizRouter, questionRouter } from './routes/quiz.routes';
import attendanceRoutes from './routes/attendance.routes';
import resourceRoutes, { lessonResourceRouter } from './routes/resource.routes';
import leadRoutes from './routes/lead.routes';
import topicRoutes from './routes/topic.routes';
import salaryRoutes from './routes/salary.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';
import certificateRoutes from './routes/certificate.routes';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(requestIdMiddleware);

morgan.token('request-id', (_req, res) => {
  const locals = (res as unknown as { locals?: { requestId?: string } }).locals;
  return locals?.requestId || '-';
});
app.use(
  morgan(
    env.NODE_ENV === 'production'
      ? ':remote-addr :method :url :status :res[content-length] - :response-time ms rid=:request-id'
      : ':method :url :status :response-time ms rid=:request-id',
    {
      skip: (req) => req.url === '/api/v1/health' || req.url === '/api/health',
    },
  ),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use('/api/v1', indexRoutes);
app.use('/api', indexRoutes); // provides GET /api/health (same router)
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/modules', moduleRouter);
app.use('/api/v1/modules', moduleRouter);
app.use('/api/lessons', lessonRouter);
app.use('/api/v1/lessons', lessonRouter);
app.use('/api/lessons', lessonQuizRouter);
app.use('/api/v1/lessons', lessonQuizRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/v1/enrollments', enrollmentRouter);
app.use('/api/batches', batchRouter);
app.use('/api/v1/batches', batchRouter);
app.use('/api/quizzes', quizRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/questions', questionRouter);
app.use('/api/v1/questions', questionRouter);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/lessons', lessonResourceRouter);
app.use('/api/v1/lessons', lessonResourceRouter);
app.use('/api/resources', resourceRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/v1/topics', topicRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/v1/salaries', salaryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/ustad', ustadRoutes);
app.use('/api/student', studentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
