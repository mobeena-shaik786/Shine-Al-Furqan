import { Types } from 'mongoose';
import { User } from '../models/User';
import { AttendanceRecord, AttendanceSession, Batch, Course, Enrollment } from '../models/academic';
import { AppError } from '../utils/AppError';
import { canManageCourse, type AcademicActor } from './academic.service';
import type {
  CreateSessionInput,
  ListMyAttendanceQuery,
  ListSessionsQuery,
  OverviewQuery,
} from '../validators/attendance.validator';

function utcDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError('sessionDate must be a valid calendar date', 400);
  }
  return date;
}

function dayBounds(value: string) {
  const start = utcDate(value);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function plannedHoursFromBatch(
  batch: import('../models/academic').IBatch,
  sessionDate: Date,
) {
  const weekday = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][sessionDate.getUTCDay()] as
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  const slots = (batch.scheduleSlots || []).filter((s) => s.day === weekday);
  if (slots.length === 0) return 2;
  let minutes = 0;
  for (const slot of slots) {
    const [sh, sm] = slot.startTime.split(':').map(Number);
    const [eh, em] = slot.endTime.split(':').map(Number);
    minutes += Math.max(0, eh * 60 + em - (sh * 60 + sm));
  }
  return Math.max(0.5, Math.round((minutes / 60) * 10) / 10) || 2;
}

async function sessionOrThrow(id: string) {
  const session = await AttendanceSession.findById(id);
  if (!session) throw new AppError('Attendance session not found', 404);
  return session;
}

async function assertManager(actor: AcademicActor, batch: import('../models/academic').IBatch) {
  const course = await Course.findById(batch.course);
  if (!course) throw new AppError('Course not found', 404);
  const isBatchInstructor =
    actor.role === 'ustad' && batch.instructors.some((id) => String(id) === actor.id);
  if (!(canManageCourse(actor, course) || isBatchInstructor)) {
    throw new AppError('You do not have permission to manage attendance', 403);
  }
}

function sessionDto(session: import('../models/academic').IAttendanceSession) {
  return {
    _id: String(session._id),
    batchId: String(session.batch),
    courseId: String(session.course),
    sessionDate: session.sessionDate.toISOString().slice(0, 10),
    note: session.note,
    status: session.status || 'conducted',
    plannedHours: session.plannedHours ?? 2,
    completedHours: session.completedHours ?? session.plannedHours ?? 2,
    ustadPresent: session.ustadPresent !== false,
    createdBy: String(session.createdBy),
    createdAt: session.createdAt?.toISOString?.() ?? undefined,
  };
}

export async function createSession(actor: AcademicActor, input: CreateSessionInput) {
  const batch = await Batch.findById(input.batchId);
  if (!batch) throw new AppError('Batch not found', 404);
  await assertManager(actor, batch);
  const sessionDate = utcDate(input.sessionDate);
  const hours = plannedHoursFromBatch(batch, sessionDate);
  try {
    return sessionDto(
      await AttendanceSession.create({
        batch: batch._id,
        course: batch.course,
        sessionDate,
        note: input.note,
        status: 'conducted',
        plannedHours: hours,
        completedHours: hours,
        ustadPresent: true,
        createdBy: actor.id,
      }),
    );
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError('An attendance session already exists for this batch and date', 409);
    }
    throw error;
  }
}

export async function listSessions(actor: AcademicActor, query: ListSessionsQuery) {
  const filter: Record<string, unknown> = {};
  if (query.batchId) filter.batch = query.batchId;
  if (query.courseId) filter.course = query.courseId;
  if (query.date) {
    const { start, end } = dayBounds(query.date);
    filter.sessionDate = { $gte: start, $lt: end };
  }

  if (actor.role === 'ustad') {
    const managedCourseIds = await Course.find({ instructors: actor.id }).distinct('_id');
    const allowedBatchIds = await Batch.find({
      $or: [{ instructors: actor.id }, { course: { $in: managedCourseIds } }],
    }).distinct('_id');

    if (query.batchId) {
      const allowed = allowedBatchIds.some((id) => String(id) === query.batchId);
      if (!allowed) {
        return {
          sessions: [],
          meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
        };
      }
    } else {
      filter.batch = { $in: allowedBatchIds };
    }
  }

  const [rows, total] = await Promise.all([
    AttendanceSession.find(filter)
      .sort('-sessionDate')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    AttendanceSession.countDocuments(filter),
  ]);
  return {
    sessions: rows.map(sessionDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getOverview(actor: AcademicActor, query: OverviewQuery) {
  const { start, end } = dayBounds(query.date);
  const filter: Record<string, unknown> = {
    sessionDate: { $gte: start, $lt: end },
  };
  if (query.batchId) filter.batch = query.batchId;

  if (actor.role === 'ustad') {
    const managedCourseIds = await Course.find({ instructors: actor.id }).distinct('_id');
    const allowedBatchIds = await Batch.find({
      $or: [{ instructors: actor.id }, { course: { $in: managedCourseIds } }],
    }).distinct('_id');
    if (query.batchId) {
      const allowed = allowedBatchIds.some((id) => String(id) === query.batchId);
      if (!allowed) {
        return {
          stats: {
            totalClasses: 0,
            conducted: 0,
            cancelled: 0,
            successRate: 0,
            avgStudentAttendance: 0,
          },
          classes: [],
        };
      }
    } else {
      filter.batch = { $in: allowedBatchIds };
    }
  }

  const sessions = await AttendanceSession.find(filter).sort('-createdAt');
  const batchIds = [...new Set(sessions.map((s) => String(s.batch)))];
  const courseIds = [...new Set(sessions.map((s) => String(s.course)))];
  const batches = batchIds.length
    ? await Batch.find({ _id: { $in: batchIds } }).select('_id name instructors capacity')
    : [];
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select('_id title')
    : [];
  const ustadIds = [...new Set(batches.flatMap((b) => b.instructors.map(String)))];
  const ustads = ustadIds.length
    ? await User.find({ _id: { $in: ustadIds } }).select('_id name')
    : [];
  const batchById = new Map(batches.map((b) => [String(b._id), b]));
  const courseById = new Map(courses.map((c) => [String(c._id), c]));
  const ustadById = new Map(ustads.map((u) => [String(u._id), u]));

  const sessionIds = sessions.map((s) => s._id);
  const records = sessionIds.length
    ? await AttendanceRecord.find({ session: { $in: sessionIds } })
    : [];
  const recordsBySession = new Map<string, typeof records>();
  for (const record of records) {
    const key = String(record.session);
    const list = recordsBySession.get(key) ?? [];
    list.push(record);
    recordsBySession.set(key, list);
  }

  const enrollmentCounts = batchIds.length
    ? await Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            batch: { $in: batchIds.map((id) => new Types.ObjectId(id)) },
            status: { $in: ['active', 'completed'] },
          },
        },
        { $group: { _id: '$batch', count: { $sum: 1 } } },
      ])
    : [];
  const enrolledByBatch = new Map(enrollmentCounts.map((r) => [String(r._id), r.count]));

  let conducted = 0;
  let cancelled = 0;
  let attendanceSum = 0;
  let attendanceN = 0;

  const classes = sessions.map((session) => {
    const batch = batchById.get(String(session.batch));
    const course = courseById.get(String(session.course));
    const sessionRecords = recordsBySession.get(String(session._id)) ?? [];
    const present = sessionRecords.filter(
      (r) => r.status === 'present' || r.status === 'late',
    ).length;
    const totalStudents =
      enrolledByBatch.get(String(session.batch)) ||
      Math.max(sessionRecords.length, batch?.capacity || 0);
    const percent = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
    const status = session.status || 'conducted';
    if (status === 'cancelled') cancelled += 1;
    else {
      conducted += 1;
      attendanceSum += percent;
      attendanceN += 1;
    }

    const firstUstadId = batch?.instructors?.[0] ? String(batch.instructors[0]) : '';
    const planned = session.plannedHours ?? 2;
    const completed = status === 'cancelled' ? 0 : (session.completedHours ?? planned);

    return {
      ...sessionDto(session),
      batchName: batch?.name || '—',
      courseTitle: course?.title || '—',
      ustadName: firstUstadId ? ustadById.get(firstUstadId)?.name || '—' : '—',
      ustadPresent: session.ustadPresent !== false && status !== 'cancelled',
      presentCount: present,
      totalStudents,
      attendancePercent: percent,
      hoursLabel: `${completed}/${planned} hours`,
      hoursPercent: planned > 0 ? Math.round((completed / planned) * 100) : 0,
      occurredAt: session.createdAt?.toISOString?.() || session.sessionDate.toISOString(),
    };
  });

  const totalClasses = sessions.length;
  return {
    stats: {
      totalClasses,
      conducted,
      cancelled,
      successRate: totalClasses > 0 ? Math.round((conducted / totalClasses) * 100) : 0,
      avgStudentAttendance: attendanceN > 0 ? Math.round(attendanceSum / attendanceN) : 0,
    },
    classes,
  };
}

export async function upsertRecords(
  actor: AcademicActor,
  sessionId: string,
  records: Array<{ studentId: string; status: import('../models/academic').AttendanceStatus }>,
) {
  const session = await sessionOrThrow(sessionId);
  const batch = await Batch.findById(session.batch);
  if (!batch) throw new AppError('Batch not found', 404);
  await assertManager(actor, batch);
  if (new Set(records.map((record) => record.studentId)).size !== records.length) {
    throw new AppError('Each student may only appear once', 400);
  }

  const studentIds = records.map((r) => r.studentId);
  const enrollments = await Enrollment.find({
    student: { $in: studentIds },
    course: session.course,
    status: 'active',
  }).select('student batch');
  const enrollmentByStudent = new Map(enrollments.map((e) => [String(e.student), e]));

  for (const record of records) {
    const enrollment = enrollmentByStudent.get(record.studentId);
    if (
      !enrollment ||
      (enrollment.batch && String(enrollment.batch) !== String(session.batch))
    ) {
      throw new AppError('Student does not have an eligible active enrollment', 400);
    }
  }

  await Promise.all(
    records.map((record) =>
      AttendanceRecord.findOneAndUpdate(
        { session: session._id, student: record.studentId },
        {
          $set: {
            status: record.status,
            markedBy: new Types.ObjectId(actor.id),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ),
  );
  return getSessionWithRecords(actor, sessionId);
}

export async function getSessionWithRecords(actor: AcademicActor, sessionId: string) {
  const session = await sessionOrThrow(sessionId);
  const records = await AttendanceRecord.find({
    session: session._id,
    ...(actor.role === 'student' ? { student: actor.id } : {}),
  }).sort('createdAt');
  if (
    actor.role === 'student' &&
    !(await Enrollment.exists({ student: actor.id, course: session.course, status: 'active' }))
  ) {
    throw new AppError('You do not have permission to view this attendance session', 403);
  }
  if (actor.role !== 'student') {
    const batch = await Batch.findById(session.batch);
    if (!batch) throw new AppError('Batch not found', 404);
    await assertManager(actor, batch);
  }
  return {
    ...sessionDto(session),
    records: records.map((record) => ({
      _id: String(record._id),
      studentId: String(record.student),
      status: record.status,
      markedBy: String(record.markedBy),
    })),
  };
}

export async function listMyAttendance(studentId: string, query: ListMyAttendanceQuery) {
  const filter = { student: studentId };
  const [records, total] = await Promise.all([
    AttendanceRecord.find(filter)
      .populate<{ session: import('../models/academic').IAttendanceSession }>('session')
      .sort('-createdAt')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    AttendanceRecord.countDocuments(filter),
  ]);
  return {
    items: records
      .filter((record) => record.session)
      .map((record) => ({
        ...sessionDto(record.session),
        record: {
          _id: String(record._id),
          status: record.status,
          markedBy: String(record.markedBy),
        },
      })),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}
