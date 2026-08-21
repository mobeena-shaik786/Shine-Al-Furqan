import { Types } from 'mongoose';
import { z } from 'zod';
import { User } from '../models/User';
import { Batch, Certificate, Course, Enrollment } from '../models/academic';
import { AppError } from '../utils/AppError';
import { escapeRegExp } from '../utils/escapeRegExp';

const objectIdString = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Valid id is required');

export const listCertificatesQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  batchId: objectIdString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const listEligibleQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  batchId: objectIdString.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const issueCertificatesSchema = z
  .object({
    batchId: objectIdString,
    studentIds: z.array(objectIdString).optional(),
  })
  .refine((data) => !data.studentIds || data.studentIds.length > 0, {
    message: 'studentIds cannot be empty when provided',
    path: ['studentIds'],
  });

export type AcademicActor = { id: string; role: string };

function toCertificateDto(row: {
  _id: unknown;
  certificateNo: string;
  student: unknown;
  batch: unknown;
  course: unknown;
  issuedAt: Date;
  issuedBy: unknown;
  createdAt: Date;
  updatedAt: Date;
  studentName?: string;
  batchName?: string;
  courseTitle?: string;
}) {
  return {
    _id: String(row._id),
    certificateNo: row.certificateNo,
    studentId: String(row.student),
    batchId: String(row.batch),
    courseId: String(row.course),
    studentName: row.studentName || '—',
    batchName: row.batchName || '—',
    courseTitle: row.courseTitle || '—',
    issuedAt: row.issuedAt.toISOString(),
    issuedBy: String(row.issuedBy),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function nextCertificateNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SAF-${year}-`;
  const latest = await Certificate.findOne({ certificateNo: new RegExp(`^${prefix}`) })
    .sort({ certificateNo: -1 })
    .select('certificateNo');
  let seq = 1;
  if (latest?.certificateNo) {
    const part = latest.certificateNo.slice(prefix.length);
    const n = Number(part);
    if (Number.isFinite(n)) seq = n + 1;
  }
  return `${prefix}${String(seq).padStart(5, '0')}`;
}

export async function listCompletedBatches() {
  const batches = await Batch.find({ status: 'completed' }).sort({ name: 1 }).select('_id name course');
  const courseIds = [...new Set(batches.map((b) => String(b.course)))];
  const courses = await Course.find({ _id: { $in: courseIds } }).select('_id title');
  const titleById = new Map(courses.map((c) => [String(c._id), c.title]));
  return batches.map((b) => ({
    _id: String(b._id),
    name: b.name,
    courseId: String(b.course),
    courseTitle: titleById.get(String(b.course)) || '—',
  }));
}

export async function listIssuedCertificates(
  actor: AcademicActor,
  query: z.infer<typeof listCertificatesQuerySchema>,
) {
  const filter: Record<string, unknown> = {};
  if (query.batchId) filter.batch = query.batchId;
  if (actor.role === 'student') filter.student = actor.id;

  let certificates = await Certificate.find(filter).sort({ issuedAt: -1 });

  const studentIds = [...new Set(certificates.map((c) => String(c.student)))];
  const batchIds = [...new Set(certificates.map((c) => String(c.batch)))];
  const courseIds = [...new Set(certificates.map((c) => String(c.course)))];

  const [students, batches, courses] = await Promise.all([
    studentIds.length
      ? User.find({ _id: { $in: studentIds } }).select('_id name email')
      : Promise.resolve([]),
    batchIds.length
      ? Batch.find({ _id: { $in: batchIds } }).select('_id name')
      : Promise.resolve([]),
    courseIds.length
      ? Course.find({ _id: { $in: courseIds } }).select('_id title')
      : Promise.resolve([]),
  ]);

  const studentById = new Map(students.map((u) => [String(u._id), u]));
  const batchById = new Map(batches.map((b) => [String(b._id), b]));
  const courseById = new Map(courses.map((c) => [String(c._id), c]));

  let rows = certificates.map((c) => {
    const student = studentById.get(String(c.student));
    const batch = batchById.get(String(c.batch));
    const course = courseById.get(String(c.course));
    return toCertificateDto({
      ...c.toObject(),
      studentName: student?.name,
      batchName: batch?.name,
      courseTitle: course?.title,
    });
  });

  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.batchName.toLowerCase().includes(q) ||
        r.certificateNo.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q),
    );
  }

  const total = rows.length;
  const start = (query.page - 1) * query.limit;
  const pageRows = rows.slice(start, start + query.limit);

  return {
    certificates: pageRows,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function listEligibleStudents(
  actor: AcademicActor,
  query: z.infer<typeof listEligibleQuerySchema>,
) {
  if (actor.role === 'student') {
    throw new AppError('Students cannot view eligible certificate queue', 403);
  }

  const completedBatchFilter: Record<string, unknown> = { status: 'completed' };
  if (query.batchId) completedBatchFilter._id = query.batchId;
  const completedBatches = await Batch.find(completedBatchFilter).select('_id name course');
  if (completedBatches.length === 0) {
    return {
      students: [],
      meta: { page: query.page, limit: query.limit, total: 0, totalPages: 1 },
    };
  }

  const batchIds = completedBatches.map((b) => b._id);
  const enrollments = await Enrollment.find({
    batch: { $in: batchIds },
    status: { $in: ['active', 'completed'] },
  });

  const existing = await Certificate.find({ batch: { $in: batchIds } }).select('student batch');
  const issuedKeys = new Set(existing.map((c) => `${String(c.student)}:${String(c.batch)}`));

  const eligibleEnrollments = enrollments.filter(
    (e) => e.batch && !issuedKeys.has(`${String(e.student)}:${String(e.batch)}`),
  );

  const studentIds = [...new Set(eligibleEnrollments.map((e) => String(e.student)))];
  const courseIds = [
    ...new Set([
      ...eligibleEnrollments.map((e) => String(e.course)),
      ...completedBatches.map((b) => String(b.course)),
    ]),
  ];

  const [students, courses] = await Promise.all([
    studentIds.length
      ? User.find({ _id: { $in: studentIds } }).select('_id name email')
      : Promise.resolve([]),
    courseIds.length
      ? Course.find({ _id: { $in: courseIds } }).select('_id title')
      : Promise.resolve([]),
  ]);

  const studentById = new Map(students.map((u) => [String(u._id), u]));
  const courseById = new Map(courses.map((c) => [String(c._id), c]));
  const batchById = new Map(completedBatches.map((b) => [String(b._id), b]));

  let rows = eligibleEnrollments
    .map((e) => {
      const student = studentById.get(String(e.student));
      const batch = e.batch ? batchById.get(String(e.batch)) : undefined;
      const course = courseById.get(String(e.course));
      return {
        studentId: String(e.student),
        studentName: student?.name || '—',
        studentEmail: student?.email || '',
        batchId: e.batch ? String(e.batch) : '',
        batchName: batch?.name || '—',
        courseId: String(e.course),
        courseTitle: course?.title || '—',
        enrollmentId: String(e._id),
      };
    })
    .filter((r) => r.batchId);

  if (query.search) {
    const q = query.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.studentName.toLowerCase().includes(q) ||
        r.batchName.toLowerCase().includes(q) ||
        r.studentEmail.toLowerCase().includes(q) ||
        r.courseTitle.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => a.studentName.localeCompare(b.studentName));
  const total = rows.length;
  const start = (query.page - 1) * query.limit;
  const pageRows = rows.slice(start, start + query.limit);

  return {
    students: pageRows,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function issueCertificates(
  actor: AcademicActor,
  raw: unknown,
) {
  if (actor.role !== 'admin' && actor.role !== 'coordinator') {
    throw new AppError('Only admin or coordinator can issue certificates', 403);
  }

  const input = issueCertificatesSchema.parse(raw);
  const batch = await Batch.findById(input.batchId);
  if (!batch) throw new AppError('Batch not found', 404);
  if (batch.status !== 'completed') {
    throw new AppError('Certificates can only be issued for completed batches', 400, [
      { field: 'batchId', message: 'Batch must be completed' },
    ]);
  }

  const enrollmentFilter: Record<string, unknown> = {
    batch: batch._id,
    status: { $in: ['active', 'completed'] },
  };
  if (input.studentIds?.length) {
    enrollmentFilter.student = { $in: input.studentIds };
  }

  const enrollments = await Enrollment.find(enrollmentFilter);
  if (enrollments.length === 0) {
    throw new AppError('No eligible students found for this batch', 400);
  }

  const existing = await Certificate.find({
    batch: batch._id,
    student: { $in: enrollments.map((e) => e.student) },
  }).select('student');
  const already = new Set(existing.map((c) => String(c.student)));

  const toIssue = enrollments.filter((e) => !already.has(String(e.student)));
  if (toIssue.length === 0) {
    throw new AppError('All selected students already have certificates for this batch', 409);
  }

  const created = [];
  for (const enrollment of toIssue) {
    let attempts = 0;
    while (attempts < 5) {
      attempts += 1;
      try {
        const certificateNo = await nextCertificateNo();
        const doc = await Certificate.create({
          certificateNo,
          student: enrollment.student,
          batch: batch._id,
          course: enrollment.course || batch.course,
          issuedAt: new Date(),
          issuedBy: new Types.ObjectId(actor.id),
        });
        created.push(doc);
        break;
      } catch (err) {
        if (
          err &&
          typeof err === 'object' &&
          'code' in err &&
          (err as { code?: number }).code === 11000 &&
          attempts < 5
        ) {
          continue;
        }
        throw err;
      }
    }
  }

  const studentIds = created.map((c) => String(c.student));
  const students = await User.find({ _id: { $in: studentIds } }).select('_id name');
  const nameById = new Map(students.map((u) => [String(u._id), u.name]));
  const course = await Course.findById(batch.course).select('title');

  return created.map((c) =>
    toCertificateDto({
      ...c.toObject(),
      studentName: nameById.get(String(c.student)),
      batchName: batch.name,
      courseTitle: course?.title,
    }),
  );
}
