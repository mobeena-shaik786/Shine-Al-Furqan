import { Types } from 'mongoose';
import { User } from '../models/User';
import {
  Batch,
  Course,
  CourseModule,
  Enrollment,
  Lesson,
  LessonProgress,
  normalizeCourseCode,
  type IBatch,
  type ICourse,
  type ILesson,
  type IModule,
} from '../models/academic';
import { AppError } from '../utils/AppError';
import { escapeRegExp } from '../utils/escapeRegExp';
import {
  createBatchSchema,
  createCourseSchema,
  createLessonSchema,
  createModuleSchema,
  type CreateBatchInput,
  type CreateCourseInput,
  type CreateLessonInput,
  type CreateModuleInput,
  type CreateEnrollmentInput,
  type ListBatchesQuery,
  type ListCoursesQuery,
  type ListEnrollmentsQuery,
  type UpdateBatchInput,
  type UpdateCourseInput,
  type UpdateLessonInput,
  type UpdateModuleInput,
} from '../validators/academic.validator';

function isDuplicateKeyError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: number }).code === 11000,
  );
}

/** Ensure every id exists, is active, and has role ustad. */
export async function assertUstadInstructors(instructorIds: string[]): Promise<void> {
  if (instructorIds.length === 0) return;

  const unique = [...new Set(instructorIds)];
  const users = await User.find({ _id: { $in: unique } }).select('_id role isActive');

  if (users.length !== unique.length) {
    throw new AppError('One or more instructors were not found', 400, [
      { field: 'instructorIds', message: 'Invalid instructor reference' },
    ]);
  }

  for (const user of users) {
    if (user.role !== 'ustad') {
      throw new AppError('Instructors must have the ustad role', 400, [
        { field: 'instructorIds', message: `User ${user._id} is not an ustad` },
      ]);
    }
    if (!user.isActive) {
      throw new AppError('Instructors must be active users', 400, [
        { field: 'instructorIds', message: `User ${user._id} is inactive` },
      ]);
    }
  }
}

export async function assertCoordinator(coordinatorId?: string | null): Promise<void> {
  if (!coordinatorId) return;
  const user = await User.findById(coordinatorId).select('_id role isActive');
  if (!user) {
    throw new AppError('Coordinator not found', 400, [
      { field: 'coordinatorId', message: 'Invalid coordinator reference' },
    ]);
  }
  if (user.role !== 'coordinator' && user.role !== 'admin') {
    throw new AppError('Coordinator must have the coordinator role', 400, [
      { field: 'coordinatorId', message: 'User is not a coordinator' },
    ]);
  }
  if (!user.isActive) {
    throw new AppError('Coordinator must be an active user', 400, [
      { field: 'coordinatorId', message: 'Coordinator is inactive' },
    ]);
  }
}

export async function createCourse(
  raw: CreateCourseInput | Record<string, unknown>,
  createdBy: string,
): Promise<ICourse> {
  const input = createCourseSchema.parse(raw);
  const rawCode = (input.code && input.code.trim()) || input.title;
  let code = normalizeCourseCode(rawCode);
  if (!code) {
    throw new AppError('Course code is invalid', 400, [
      { field: 'code', message: 'Code must contain letters or numbers' },
    ]);
  }

  await assertUstadInstructors(input.instructorIds);

  const topicObjectIds = input.topicIds.map((id) => new Types.ObjectId(id));
  if (topicObjectIds.length > 0) {
    const { Topic } = await import('../models/academic/Topic');
    const found = await Topic.countDocuments({ _id: { $in: topicObjectIds } });
    if (found !== topicObjectIds.length) {
      throw new AppError('One or more topics were not found', 400, [
        { field: 'topicIds', message: 'Invalid topic selection' },
      ]);
    }
  }

  // Ensure unique code when auto-generated from title.
  if (!input.code?.trim()) {
    const base = code.slice(0, 50);
    let attempt = code;
    let n = 1;
    while (await Course.exists({ code: attempt })) {
      attempt = `${base}-${n}`.slice(0, 64);
      n += 1;
    }
    code = attempt;
  }

  try {
    const course = await Course.create({
      title: input.title.trim(),
      code,
      description: input.description ?? '',
      category: input.category?.trim() || 'general',
      thumbnailUrl: input.thumbnailUrl || undefined,
      status: input.status ?? 'draft',
      topics: topicObjectIds,
      instructors: input.instructorIds.map((id) => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(createdBy),
    });

    if (topicObjectIds.length > 0) {
      const { Topic } = await import('../models/academic/Topic');
      const topics = await Topic.find({ _id: { $in: topicObjectIds } });
      const byId = new Map(topics.map((t) => [String(t._id), t]));
      let order = 1;
      for (const id of input.topicIds) {
        const topic = byId.get(id);
        if (!topic) continue;
        await CourseModule.create({
          course: course._id,
          title: topic.title,
          order,
        });
        order += 1;
      }
    }

    return course;
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError('A course with this code already exists', 409, [
        { field: 'code', message: 'Course code must be unique' },
      ]);
    }
    throw err;
  }
}

export async function createModule(
  raw: CreateModuleInput | Record<string, unknown>,
): Promise<IModule> {
  const input = createModuleSchema.parse(raw);
  const course = await Course.findById(input.courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  try {
    return await CourseModule.create({
      course: course._id,
      title: input.title.trim(),
      order: input.order,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError('A module with this order already exists for the course', 409, [
        { field: 'order', message: 'Module order must be unique within a course' },
      ]);
    }
    throw err;
  }
}

export async function createLesson(
  raw: CreateLessonInput | Record<string, unknown>,
): Promise<ILesson> {
  const input = createLessonSchema.parse(raw);
  const course = await Course.findById(input.courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const moduleDoc = await CourseModule.findById(input.moduleId);
  if (!moduleDoc) {
    throw new AppError('Module not found', 404);
  }

  if (String(moduleDoc.course) !== String(course._id)) {
    throw new AppError('Module does not belong to the specified course', 400, [
      { field: 'moduleId', message: 'Invalid module/course relationship' },
    ]);
  }

  try {
    return await Lesson.create({
      course: course._id,
      module: moduleDoc._id,
      title: input.title.trim(),
      lessonType: input.lessonType ?? 'text',
      content: input.content ?? '',
      resourceUrl: input.resourceUrl || undefined,
      order: input.order,
      durationMinutes: input.durationMinutes,
      status: input.status ?? 'draft',
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError('A lesson with this order already exists for the module', 409, [
        { field: 'order', message: 'Lesson order must be unique within a module' },
      ]);
    }
    throw err;
  }
}

export async function createBatch(
  raw: CreateBatchInput | Record<string, unknown>,
  createdBy: string,
): Promise<IBatch> {
  const input = createBatchSchema.parse(raw);
  const course = await Course.findById(input.courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  await assertUstadInstructors(input.instructorIds);
  await assertCoordinator(input.coordinatorId);

  try {
    return await Batch.create({
      name: input.name.trim(),
      course: course._id,
      instructors: input.instructorIds.map((id) => new Types.ObjectId(id)),
      coordinator: input.coordinatorId ? new Types.ObjectId(input.coordinatorId) : undefined,
      capacity: input.capacity ?? 30,
      startDate: input.startDate,
      endDate: input.endDate,
      scheduleNote: input.scheduleNote ?? '',
      scheduleSlots: input.scheduleSlots ?? [],
      status: input.status ?? 'active',
      createdBy: new Types.ObjectId(createdBy),
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError('A batch with this name already exists for the course', 409, [
        { field: 'name', message: 'Batch name must be unique within a course' },
      ]);
    }
    throw err;
  }
}

/** Safe projection helpers for later API phases. */
export function toCourseDto(course: ICourse) {
  return {
    _id: String(course._id),
    title: course.title,
    code: course.code,
    description: course.description,
    category: course.category,
    thumbnailUrl: course.thumbnailUrl,
    status: course.status,
    topics: (course.topics || []).map(String),
    topicCount: (course.topics || []).length,
    instructors: course.instructors.map(String),
    createdBy: String(course.createdBy),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
  };
}

export function toModuleDto(moduleDoc: IModule) {
  return {
    _id: String(moduleDoc._id),
    courseId: String(moduleDoc.course),
    title: moduleDoc.title,
    order: moduleDoc.order,
    createdAt: moduleDoc.createdAt.toISOString(),
    updatedAt: moduleDoc.updatedAt.toISOString(),
  };
}

export function toLessonDto(lesson: ILesson) {
  return {
    _id: String(lesson._id),
    courseId: String(lesson.course),
    moduleId: String(lesson.module),
    title: lesson.title,
    lessonType: lesson.lessonType,
    content: lesson.content,
    resourceUrl: lesson.resourceUrl,
    order: lesson.order,
    durationMinutes: lesson.durationMinutes,
    status: lesson.status,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
  };
}

export function toBatchDto(batch: IBatch) {
  return {
    _id: String(batch._id),
    name: batch.name,
    courseId: String(batch.course),
    instructors: batch.instructors.map(String),
    coordinatorId: batch.coordinator ? String(batch.coordinator) : undefined,
    capacity: batch.capacity,
    startDate: batch.startDate?.toISOString(),
    endDate: batch.endDate?.toISOString(),
    scheduleNote: batch.scheduleNote,
    scheduleSlots: (batch.scheduleSlots || []).map((slot) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
    status: batch.status,
    createdBy: String(batch.createdBy),
    createdAt: batch.createdAt.toISOString(),
    updatedAt: batch.updatedAt.toISOString(),
  };
}

export type AcademicActor = { id: string; role: 'admin' | 'coordinator' | 'ustad' | 'student' };

export function canManageCourse(actor: AcademicActor, course: ICourse): boolean {
  return actor.role === 'admin' || actor.role === 'coordinator' ||
    (actor.role === 'ustad' && course.instructors.some((id) => String(id) === actor.id));
}

async function getCourseOrThrow(id: string): Promise<ICourse> {
  const course = await Course.findById(id);
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

async function assertCourseManager(actor: AcademicActor, courseId: string): Promise<ICourse> {
  const course = await getCourseOrThrow(courseId);
  if (!canManageCourse(actor, course)) throw new AppError('You do not have permission to manage this course', 403);
  return course;
}

export async function listCourses(actor: AcademicActor, query: ListCoursesQuery) {
  const roleScoped: Record<string, unknown> = {};
  if (actor.role === 'ustad') {
    roleScoped.$or = [{ instructors: actor.id }, { status: 'published' }];
  }
  if (actor.role === 'student') {
    const enrolled = await Enrollment.find({ student: actor.id, status: 'active' }).distinct('course');
    roleScoped._id = { $in: enrolled };
  }

  const filter: Record<string, unknown> = { ...roleScoped };
  if (query.search) {
    const rx = new RegExp(escapeRegExp(query.search), 'i');
    filter.$and = [...(Array.isArray(filter.$and) ? filter.$and : []), { $or: [{ title: rx }, { code: rx }, { description: rx }] }];
  }
  if (query.category) filter.category = query.category;
  if (query.status) filter.status = query.status;
  if (query.activity === 'active') filter.status = 'published';
  if (query.activity === 'inactive') filter.status = { $in: ['draft', 'archived'] };

  const [courses, total, allTotal, activeCount, inactiveCount, topicAgg] = await Promise.all([
    Course.find(filter).sort(query.sort).skip((query.page - 1) * query.limit).limit(query.limit),
    Course.countDocuments(filter),
    Course.countDocuments(roleScoped),
    Course.countDocuments({ ...roleScoped, status: 'published' }),
    Course.countDocuments({ ...roleScoped, status: { $in: ['draft', 'archived'] } }),
    Course.aggregate<{ totalTopics: number }>([
      { $match: roleScoped },
      { $project: { n: { $size: { $ifNull: ['$topics', []] } } } },
      { $group: { _id: null, totalTopics: { $sum: '$n' } } },
    ]),
  ]);
  const stats = {
    total: allTotal,
    active: activeCount,
    inactive: inactiveCount,
    totalTopics: topicAgg[0]?.totalTopics ?? 0,
  };
  const meta = {
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit) || 1,
    stats,
  };
  if (actor.role !== 'student') {
    return {
      courses: courses.map(toCourseDto),
      meta,
    };
  }
  const progressByCourse = await getCourseProgressBatch(
    actor.id,
    courses.map((c) => String(c._id)),
  );
  return {
    courses: courses.map((course) => ({
      ...toCourseDto(course),
      progressPercent: progressByCourse.get(String(course._id))?.percent ?? 0,
    })),
    meta,
  };
}

export async function getCourse(actor: AcademicActor, courseId: string) {
  const course = await getCourseOrThrow(courseId);
  if (canManageCourse(actor, course)) return toCourseDto(course);
  if (actor.role === 'ustad' && course.status === 'published') return toCourseDto(course);
  if (actor.role === 'student' && course.status === 'published' &&
    await Enrollment.exists({ student: actor.id, course: course._id, status: 'active' })) {
    return { ...toCourseDto(course), progressPercent: (await getCourseProgress(actor.id, courseId)).percent };
  }
  throw new AppError('You do not have permission to view this course', 403);
}

export async function updateCourse(actor: AcademicActor, courseId: string, input: UpdateCourseInput) {
  const course = await assertCourseManager(actor, courseId);
  if (input.instructorIds) await assertUstadInstructors(input.instructorIds);
  if (input.topicIds) {
    const { Topic } = await import('../models/academic/Topic');
    const topicObjectIds = input.topicIds.map((id) => new Types.ObjectId(id));
    const found = await Topic.countDocuments({ _id: { $in: topicObjectIds } });
    if (found !== topicObjectIds.length) {
      throw new AppError('One or more topics were not found', 400, [
        { field: 'topicIds', message: 'Invalid topic selection' },
      ]);
    }
    course.topics = topicObjectIds;
  }
  Object.assign(course, {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
    ...(input.instructorIds !== undefined ? { instructors: input.instructorIds.map((id) => new Types.ObjectId(id)) } : {}),
  });
  await course.save();
  return toCourseDto(course);
}

export async function deleteCourse(actor: AcademicActor, courseId: string) {
  const course = await assertCourseManager(actor, courseId);
  await CourseModule.deleteMany({ course: course._id });
  await course.deleteOne();
}

export async function updateCourseStatus(actor: AcademicActor, id: string, status: ICourse['status']) {
  const course = await assertCourseManager(actor, id);
  course.status = status;
  await course.save();
  return toCourseDto(course);
}

export async function listModules(actor: AcademicActor, courseId: string) {
  await getCourse(actor, courseId);
  return (await CourseModule.find({ course: courseId }).sort('order')).map(toModuleDto);
}

export async function createModuleForCourse(actor: AcademicActor, courseId: string, raw: Record<string, unknown>) {
  await assertCourseManager(actor, courseId);
  return toModuleDto(await createModule({ ...raw, courseId }));
}

export async function updateModule(actor: AcademicActor, id: string, input: UpdateModuleInput) {
  const moduleDoc = await CourseModule.findById(id);
  if (!moduleDoc) throw new AppError('Module not found', 404);
  await assertCourseManager(actor, String(moduleDoc.course));
  Object.assign(moduleDoc, input);
  await moduleDoc.save();
  return toModuleDto(moduleDoc);
}

export async function deleteModule(actor: AcademicActor, id: string) {
  const moduleDoc = await CourseModule.findById(id);
  if (!moduleDoc) throw new AppError('Module not found', 404);
  await assertCourseManager(actor, String(moduleDoc.course));
  await Lesson.deleteMany({ module: moduleDoc._id });
  await moduleDoc.deleteOne();
}

export async function listLessons(actor: AcademicActor, courseId: string) {
  const course = await getCourseOrThrow(courseId);
  if (canManageCourse(actor, course)) return (await Lesson.find({ course: courseId }).sort({ module: 1, order: 1 })).map(toLessonDto);
  await getCourse(actor, courseId);
  return (await Lesson.find({ course: courseId, status: 'published' }).sort({ module: 1, order: 1 })).map(toLessonDto);
}

export async function createLessonForModule(actor: AcademicActor, moduleId: string, raw: Record<string, unknown>) {
  const moduleDoc = await CourseModule.findById(moduleId);
  if (!moduleDoc) throw new AppError('Module not found', 404);
  await assertCourseManager(actor, String(moduleDoc.course));
  return toLessonDto(await createLesson({ ...raw, moduleId, courseId: String(moduleDoc.course) }));
}

export async function updateLesson(actor: AcademicActor, id: string, input: UpdateLessonInput) {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await assertCourseManager(actor, String(lesson.course));
  Object.assign(lesson, input);
  await lesson.save();
  return toLessonDto(lesson);
}

export async function deleteLesson(actor: AcademicActor, id: string) {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await assertCourseManager(actor, String(lesson.course));
  await lesson.deleteOne();
}

export async function createEnrollment(actor: AcademicActor, raw: CreateEnrollmentInput) {
  const student = await User.findById(raw.studentId).select('role isActive');
  if (!student || student.role !== 'student' || !student.isActive) throw new AppError('Student must be an active student user', 400);
  const course = await getCourseOrThrow(raw.courseId);
  if (course.status !== 'published') throw new AppError('Only published courses can be enrolled', 400);
  if (raw.batchId) {
    const batch = await Batch.findOne({ _id: raw.batchId, course: course._id });
    if (!batch) throw new AppError('Batch does not belong to the course', 400);
  }
  try {
    const enrollment = await Enrollment.create({ student: student._id, course: course._id, batch: raw.batchId, createdBy: actor.id });
    return toEnrollmentDto(enrollment);
  } catch (err) {
    if (isDuplicateKeyError(err)) throw new AppError('Student is already enrolled in this course', 409);
    throw err;
  }
}

export async function listBatches(actor: AcademicActor, query: ListBatchesQuery = { page: 1, limit: 50, sort: '-createdAt' }) {
  const filter: Record<string, unknown> = {};
  if (query.courseId) filter.course = query.courseId;
  if (query.status) {
    filter.status = query.status;
  } else if (query.activity === 'active') {
    filter.status = 'active';
  } else if (query.activity === 'completed') {
    filter.status = 'completed';
  } else if (query.activity === 'inactive') {
    filter.status = { $in: ['planned', 'cancelled'] };
  }
  if (query.search) filter.name = new RegExp(escapeRegExp(query.search), 'i');
  if (actor.role === 'ustad') {
    const managedCourseIds = await Course.find({ instructors: actor.id }).distinct('_id');
    filter.$or = [{ instructors: actor.id }, { course: { $in: managedCourseIds } }];
  }

  const sortKey = query.sort || '-createdAt';
  const sort: Record<string, 1 | -1> =
    sortKey === 'name'
      ? { name: 1 }
      : sortKey === '-name'
        ? { name: -1 }
        : sortKey === 'createdAt'
          ? { createdAt: 1 }
          : { createdAt: -1 };

  const [batches, total, allForStats] = await Promise.all([
    Batch.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Batch.countDocuments(filter),
    Batch.find(actor.role === 'ustad' ? filter : {}).select('status capacity'),
  ]);

  const batchIds = batches.map((b) => b._id);
  const courseIds = [...new Set(batches.map((b) => String(b.course)))];
  const userIds = [
    ...new Set(
      batches.flatMap((b) => [
        ...b.instructors.map(String),
        ...(b.coordinator ? [String(b.coordinator)] : []),
      ]),
    ),
  ];

  const [courses, users, enrollmentAgg] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }).select('_id title'),
    userIds.length
      ? User.find({ _id: { $in: userIds } }).select('_id name')
      : Promise.resolve([]),
    batchIds.length
      ? Enrollment.aggregate<{ _id: Types.ObjectId; count: number }>([
          { $match: { batch: { $in: batchIds }, status: { $in: ['active', 'pending', 'completed'] } } },
          { $group: { _id: '$batch', count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
  ]);

  const courseTitleById = new Map(courses.map((c) => [String(c._id), c.title]));
  const userNameById = new Map(users.map((u) => [String(u._id), u.name]));
  const enrolledByBatch = new Map(enrollmentAgg.map((row) => [String(row._id), row.count]));

  let active = 0;
  let inactive = 0;
  let completed = 0;
  let totalCapacity = 0;
  for (const b of allForStats) {
    totalCapacity += b.capacity || 0;
    if (b.status === 'active') active += 1;
    else if (b.status === 'completed') completed += 1;
    else inactive += 1;
  }

  const allBatchIds = allForStats.map((b) => b._id);
  const totalStudents = allBatchIds.length
    ? (
        await Enrollment.countDocuments({
          batch: { $in: allBatchIds },
          status: { $in: ['active', 'pending', 'completed'] },
        })
      )
    : 0;

  const fullActive = batches.filter(
    (b) => b.status === 'active' && (enrolledByBatch.get(String(b._id)) || 0) >= b.capacity,
  ).length;

  return {
    batches: batches.map((batch) => {
      const base = toBatchDto(batch);
      const enrolledCount = enrolledByBatch.get(String(batch._id)) || 0;
      return {
        ...base,
        courseTitle: courseTitleById.get(String(batch.course)) || '—',
        ustadNames: batch.instructors.map((id) => userNameById.get(String(id)) || '—'),
        coordinatorName: batch.coordinator
          ? userNameById.get(String(batch.coordinator)) || '—'
          : undefined,
        enrolledCount,
      };
    }),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
      stats: {
        total: allForStats.length,
        active,
        inactive,
        completed,
        fullActive,
        totalStudents,
        totalCapacity,
        utilization:
          totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0,
      },
    },
  };
}

export async function getBatch(actor: AcademicActor, id: string) {
  const batch = await Batch.findById(id);
  if (!batch) throw new AppError('Batch not found', 404);
  if (actor.role === 'ustad') {
    const isBatchInstructor = batch.instructors.some((instructorId) => String(instructorId) === actor.id);
    if (!isBatchInstructor) {
      const course = await Course.findById(batch.course);
      if (!course || !canManageCourse(actor, course)) {
        throw new AppError('You do not have permission to view this batch', 403);
      }
    }
  }
  return toBatchDto(batch);
}

export async function updateBatch(actor: AcademicActor, id: string, input: UpdateBatchInput) {
  const batch = await Batch.findById(id);
  if (!batch) throw new AppError('Batch not found', 404);
  if (input.instructorIds) await assertUstadInstructors(input.instructorIds);
  if (input.coordinatorId !== undefined) await assertCoordinator(input.coordinatorId);

  if (input.name !== undefined) batch.name = input.name;
  if (input.capacity !== undefined) batch.capacity = input.capacity;
  if (input.scheduleNote !== undefined) batch.scheduleNote = input.scheduleNote;
  if (input.status !== undefined) batch.status = input.status;
  if (input.scheduleSlots !== undefined) batch.scheduleSlots = input.scheduleSlots;
  if (input.startDate !== undefined) batch.startDate = input.startDate ?? undefined;
  if (input.endDate !== undefined) batch.endDate = input.endDate ?? undefined;
  if (input.instructorIds) {
    batch.instructors = input.instructorIds.map((instructor) => new Types.ObjectId(instructor));
  }
  if (input.coordinatorId !== undefined) {
    batch.coordinator = input.coordinatorId
      ? new Types.ObjectId(input.coordinatorId)
      : undefined;
  }

  await batch.save();
  return toBatchDto(batch);
}

export async function deleteBatch(actor: AcademicActor, id: string) {
  const batch = await Batch.findById(id);
  if (!batch) throw new AppError('Batch not found', 404);
  await Enrollment.deleteMany({ batch: batch._id });
  await batch.deleteOne();
}

export async function listEnrollments(actor: AcademicActor, query: ListEnrollmentsQuery) {
  const filter: Record<string, unknown> =
    actor.role === 'student' ? { student: actor.id } : {};
  if (query.studentId && actor.role !== 'student') filter.student = query.studentId;
  if (query.courseId) filter.course = query.courseId;
  if (query.batchId) filter.batch = query.batchId;
  if (query.status) filter.status = query.status;
  const [rows, total] = await Promise.all([
    Enrollment.find(filter)
      .sort('-createdAt')
      .skip((query.page - 1) * query.limit)
      .limit(query.limit),
    Enrollment.countDocuments(filter),
  ]);
  return {
    enrollments: rows.map(toEnrollmentDto),
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function updateEnrollmentStatus(actor: AcademicActor, id: string, status: 'completed' | 'dropped') {
  const enrollment = await Enrollment.findById(id);
  if (!enrollment) throw new AppError('Enrollment not found', 404);
  if (actor.role === 'student') {
    if (String(enrollment.student) !== actor.id) {
      throw new AppError('You do not have permission to update this enrollment', 403);
    }
    if (status !== 'dropped') {
      throw new AppError('Students may only drop their own enrollment', 403);
    }
  }
  enrollment.status = status;
  enrollment.completedAt = status === 'completed' ? new Date() : undefined;
  await enrollment.save();
  return toEnrollmentDto(enrollment);
}

export async function getCourseProgress(studentId: string, courseId: string) {
  const active = await Enrollment.exists({ student: studentId, course: courseId, status: 'active' });
  if (!active) throw new AppError('Active enrollment is required', 403);
  const map = await getCourseProgressBatch(studentId, [courseId]);
  const summary = map.get(courseId)!;
  return summary;
}

/**
 * Batch progress for many courses in 2 queries (avoids N+1).
 * Caller must ensure enrollments are authorized when used for student lists.
 */
export async function getCourseProgressBatch(studentId: string, courseIds: string[]) {
  const result = new Map<
    string,
    {
      completedCount: number;
      totalPublishedLessons: number;
      percent: number;
      lessons: Record<string, { completed: boolean; lastAccessedAt: string }>;
    }
  >();
  if (courseIds.length === 0) return result;

  const lessons = await Lesson.find({
    course: { $in: courseIds },
    status: 'published',
  }).select('_id course');
  const lessonIds = lessons.map((l) => l._id);
  const progress =
    lessonIds.length === 0
      ? []
      : await LessonProgress.find({ student: studentId, lesson: { $in: lessonIds } });

  const lessonsByCourse = new Map<string, Types.ObjectId[]>();
  for (const lesson of lessons) {
    const key = String(lesson.course);
    const list = lessonsByCourse.get(key) ?? [];
    list.push(lesson._id);
    lessonsByCourse.set(key, list);
  }
  const progressByLesson = new Map(progress.map((p) => [String(p.lesson), p]));

  for (const courseId of courseIds) {
    const courseLessons = lessonsByCourse.get(courseId) ?? [];
    const lessonMap: Record<string, { completed: boolean; lastAccessedAt: string }> = {};
    let completed = 0;
    for (const lessonId of courseLessons) {
      const entry = progressByLesson.get(String(lessonId));
      if (entry) {
        lessonMap[String(lessonId)] = {
          completed: Boolean(entry.completedAt),
          lastAccessedAt: entry.lastAccessedAt.toISOString(),
        };
        if (entry.completedAt) completed += 1;
      }
    }
    const total = courseLessons.length;
    result.set(courseId, {
      completedCount: completed,
      totalPublishedLessons: total,
      percent: total === 0 ? 0 : Math.round((completed / total) * 100),
      lessons: lessonMap,
    });
  }
  return result;
}

export async function updateLessonProgress(studentId: string, lessonId: string, completed: boolean) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson || lesson.status !== 'published') throw new AppError('Published lesson not found', 404);
  const course = await getCourseOrThrow(String(lesson.course));
  if (course.status !== 'published') throw new AppError('Published lesson not found', 404);
  await getCourseProgress(studentId, String(course._id));
  const progress = await LessonProgress.findOneAndUpdate(
    { student: studentId, lesson: lesson._id },
    { $set: { course: course._id, lastAccessedAt: new Date(), ...(completed ? { completedAt: new Date() } : {}) } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { lessonId, completed: Boolean(progress.completedAt), lastAccessedAt: progress.lastAccessedAt.toISOString() };
}

export function toEnrollmentDto(enrollment: import('../models/academic').IEnrollment) {
  return { _id: String(enrollment._id), studentId: String(enrollment.student), courseId: String(enrollment.course), batchId: enrollment.batch ? String(enrollment.batch) : undefined, status: enrollment.status, enrolledAt: enrollment.enrolledAt.toISOString(), completedAt: enrollment.completedAt?.toISOString(), createdBy: String(enrollment.createdBy) };
}
