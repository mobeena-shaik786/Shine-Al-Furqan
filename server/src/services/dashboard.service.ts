import { Types } from 'mongoose';
import { User } from '../models/User';
import {
  AttendanceRecord,
  AttendanceSession,
  Batch,
  Course,
  Enrollment,
  LessonProgress,
  QuizAttempt,
} from '../models/academic';
import type { AcademicActor } from './academic.service';

function startOfUtcMonth(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0, 1));
}

function endOfUtcMonth(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0 + 1, 1));
}

function parseMonth(month?: string): { year: number; monthIndex0: number; label: string } {
  const now = new Date();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    return { year: y, monthIndex0: m - 1, label: month };
  }
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  return { year: y, monthIndex0: m, label: `${y}-${String(m + 1).padStart(2, '0')}` };
}

async function attendanceForRange(from: Date, to: Date, courseIds?: Types.ObjectId[]) {
  const sessionFilter: Record<string, unknown> = {
    sessionDate: { $gte: from, $lt: to },
  };
  if (courseIds) sessionFilter.course = { $in: courseIds };
  const sessions = await AttendanceSession.find(sessionFilter).select('_id');
  const ids = sessions.map((s) => s._id);
  if (ids.length === 0) {
    return { present: 0, absent: 0, late: 0, excused: 0, totalRecords: 0, rate: 0 };
  }
  const grouped = await AttendanceRecord.aggregate<{ _id: string; count: number }>([
    { $match: { session: { $in: ids } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const counts = Object.fromEntries(grouped.map((g) => [g._id, g.count])) as Record<
    string,
    number
  >;
  const present = counts.present ?? 0;
  const absent = counts.absent ?? 0;
  const late = counts.late ?? 0;
  const excused = counts.excused ?? 0;
  const totalRecords = present + absent + late + excused;
  const rate = totalRecords === 0 ? 0 : Math.round((present / totalRecords) * 100);
  return { present, absent, late, excused, totalRecords, rate };
}

async function recentEnrollments(limit = 8, courseIds?: Types.ObjectId[]) {
  if (courseIds && courseIds.length === 0) return [];
  const filter = courseIds ? { course: { $in: courseIds } } : {};
  const rows = await Enrollment.find(filter).sort('-enrolledAt').limit(limit);
  const studentIds = [...new Set(rows.map((r) => String(r.student)))];
  const courseIdList = [...new Set(rows.map((r) => String(r.course)))];
  const [students, courses] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select('name'),
    Course.find({ _id: { $in: courseIdList } }).select('title'),
  ]);
  const nameById = new Map(students.map((s) => [String(s._id), s.name]));
  const titleById = new Map(courses.map((c) => [String(c._id), c.title]));
  return rows.map((r) => ({
    id: String(r._id),
    studentName: nameById.get(String(r.student)) ?? 'Unknown',
    course: titleById.get(String(r.course)) ?? 'Unknown',
    enrollmentDate: r.enrolledAt.toISOString().slice(0, 10),
    status: r.status === 'pending' || r.status === 'completed' || r.status === 'active' ? r.status : 'active',
  }));
}

async function capacitySummary(courseIds?: Types.ObjectId[]) {
  const filter: Record<string, unknown> = { status: { $in: ['planned', 'active'] } };
  if (courseIds) filter.course = { $in: courseIds };
  const batches = await Batch.find(filter).select('_id capacity');
  const totalSeats = batches.reduce((sum, b) => sum + b.capacity, 0);
  const batchIds = batches.map((b) => b._id);
  const used = batchIds.length
    ? await Enrollment.countDocuments({ status: 'active', batch: { $in: batchIds } })
    : 0;
  const availableSeats = Math.max(0, totalSeats - used);
  const utilizationPercent = totalSeats === 0 ? 0 : Math.round((used / totalSeats) * 100);
  return { totalSeats, usedSeats: used, availableSeats, utilizationPercent, batchCount: batches.length };
}

/**
 * Admin / coordinator academy-wide dashboard.
 * All "active" user counts mean: role matches AND isActive === true.
 */
export async function getAdminDashboard(month?: string) {
  const { year, monthIndex0, label } = parseMonth(month);
  const from = startOfUtcMonth(year, monthIndex0);
  const to = endOfUtcMonth(year, monthIndex0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    activeStudents,
    activeUstads,
    activeCoordinators,
    publishedCourses,
    activeBatches,
    activeEnrollments,
    attendance,
    capacity,
    recent,
    quizAttemptsWeek,
    lessonsCompletedWeek,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'ustad', isActive: true }),
    User.countDocuments({ role: 'coordinator', isActive: true }),
    Course.countDocuments({ status: 'published' }),
    Batch.countDocuments({ status: 'active' }),
    Enrollment.countDocuments({ status: 'active' }),
    attendanceForRange(from, to),
    capacitySummary(),
    recentEnrollments(8),
    QuizAttempt.countDocuments({ submittedAt: { $gte: weekAgo } }),
    LessonProgress.countDocuments({ completedAt: { $gte: weekAgo } }),
  ]);

  return {
    role: 'admin' as const,
    title: 'Admin Dashboard',
    message: 'Academy overview from live MongoDB aggregates',
    metrics: {
      activeStudents,
      activeUstads,
      activeCoordinators,
      publishedCourses,
      activeBatches,
      activeEnrollments,
      quizAttemptsLast7Days: quizAttemptsWeek,
      lessonsCompletedLast7Days: lessonsCompletedWeek,
    },
    capacity,
    attendance: { ...attendance, month: label },
    recentEnrollments: recent,
  };
}

export async function getCoordinatorDashboard(month?: string) {
  const data = await getAdminDashboard(month);
  return {
    ...data,
    role: 'coordinator' as const,
    title: 'Coordinator Dashboard',
    message: 'Students, enrollments, and attendance overview',
  };
}

/** Ustad: scoped to courses/batches where they are an instructor. */
export async function getUstadDashboard(actor: AcademicActor, month?: string) {
  const { year, monthIndex0, label } = parseMonth(month);
  const from = startOfUtcMonth(year, monthIndex0);
  const to = endOfUtcMonth(year, monthIndex0);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const ustadId = new Types.ObjectId(actor.id);

  const courses = await Course.find({ instructors: ustadId }).select('_id title status');
  const courseIds = courses.map((c) => c._id);
  const batches = await Batch.find({
    $or: [{ instructors: ustadId }, { course: { $in: courseIds } }],
  }).select('_id capacity status course');

  const emptyAttendance = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    totalRecords: 0,
    rate: 0,
  };
  const emptyCapacity = {
    totalSeats: 0,
    usedSeats: 0,
    availableSeats: 0,
    utilizationPercent: 0,
    batchCount: 0,
  };

  const [
    assignedStudents,
    activeEnrollments,
    attendance,
    capacity,
    recent,
    quizAttemptsWeek,
    lessonsCompletedWeek,
  ] = await Promise.all([
    courseIds.length
      ? Enrollment.distinct('student', { course: { $in: courseIds }, status: 'active' }).then(
          (ids) => ids.length,
        )
      : Promise.resolve(0),
    courseIds.length
      ? Enrollment.countDocuments({ course: { $in: courseIds }, status: 'active' })
      : Promise.resolve(0),
    courseIds.length ? attendanceForRange(from, to, courseIds) : Promise.resolve(emptyAttendance),
    courseIds.length ? capacitySummary(courseIds) : Promise.resolve(emptyCapacity),
    recentEnrollments(8, courseIds.length ? courseIds : []),
    courseIds.length
      ? QuizAttempt.countDocuments({ course: { $in: courseIds }, submittedAt: { $gte: weekAgo } })
      : Promise.resolve(0),
    courseIds.length
      ? LessonProgress.countDocuments({ course: { $in: courseIds }, completedAt: { $gte: weekAgo } })
      : Promise.resolve(0),
  ]);

  return {
    role: 'ustad' as const,
    title: 'Ustad Dashboard',
    message: 'Your assigned courses, batches, and learner activity',
    metrics: {
      assignedCourses: courses.length,
      publishedAssignedCourses: courses.filter((c) => c.status === 'published').length,
      assignedBatches: batches.length,
      assignedStudents,
      activeEnrollments,
      quizAttemptsLast7Days: quizAttemptsWeek,
      lessonsCompletedLast7Days: lessonsCompletedWeek,
    },
    capacity,
    attendance: { ...attendance, month: label },
    recentEnrollments: recent,
    courses: courses.map((c) => ({
      _id: String(c._id),
      title: c.title,
      status: c.status,
    })),
  };
}

/** Student: enrolled courses + progress already on client; enrich with attendance + quiz summary. */
export async function getStudentDashboard(actor: AcademicActor) {
  const enrollments = await Enrollment.find({ student: actor.id, status: 'active' }).sort(
    '-enrolledAt',
  );
  const courseIds = enrollments.map((e) => String(e.course));
  const courses = await Course.find({ _id: { $in: courseIds } }).select('title code status');
  const titleById = new Map(courses.map((c) => [String(c._id), c]));

  const { getCourseProgressBatch } = await import('./academic.service');
  const progressByCourse = await getCourseProgressBatch(actor.id, courseIds);

  const progressRows = enrollments.map((enrollment) => {
    const courseId = String(enrollment.course);
    const course = titleById.get(courseId);
    return {
      enrollmentId: String(enrollment._id),
      courseId,
      title: course?.title ?? 'Course',
      code: course?.code ?? '',
      status: course?.status ?? 'draft',
      progressPercent: progressByCourse.get(courseId)?.percent ?? 0,
      enrolledAt: enrollment.enrolledAt.toISOString(),
    };
  });

  const [quizAttempts, attendanceRows] = await Promise.all([
    QuizAttempt.countDocuments({ student: actor.id }),
    AttendanceRecord.find({ student: actor.id }).sort('-createdAt').limit(5).populate('session'),
  ]);

  const recentAttendance = attendanceRows
    .filter((r) => r.session)
    .map((r) => {
      const session = r.session as unknown as { sessionDate?: Date };
      return {
        status: r.status,
        sessionDate: session.sessionDate
          ? new Date(session.sessionDate).toISOString().slice(0, 10)
          : undefined,
      };
    });

  const resume = progressRows.find((c) => c.progressPercent < 100) ?? progressRows[0] ?? null;

  return {
    role: 'student' as const,
    title: 'Student Dashboard',
    message: 'Your enrolled courses and recent activity',
    metrics: {
      activeEnrollments: enrollments.length,
      quizAttemptsTotal: quizAttempts,
      averageProgressPercent:
        progressRows.length === 0
          ? 0
          : Math.round(
              progressRows.reduce((sum, row) => sum + row.progressPercent, 0) / progressRows.length,
            ),
    },
    courses: progressRows,
    resumeCourse: resume,
    recentAttendance,
  };
}
