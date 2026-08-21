import { randomUUID } from 'crypto';
import {
  detectMimeFromBuffer,
  isAllowedMimeType,
  MIME_TO_EXTENSION,
  sanitizeDisplayFilename,
  type AllowedMimeType,
} from '../config/uploads';
import { Course, Enrollment, LearningResource, Lesson, type ICourse } from '../models/academic';
import { getStorageProvider } from '../storage';
import { AppError } from '../utils/AppError';
import {
  canManageCourse,
  type AcademicActor,
} from './academic.service';

export type ResourceDto = {
  _id: string;
  courseId: string;
  lessonId: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  status: 'active' | 'deleted';
  createdAt: string;
  downloadPath: string;
};

function toDto(doc: {
  _id: unknown;
  course: unknown;
  lesson: unknown;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: unknown;
  status: 'active' | 'deleted';
  createdAt: Date;
}): ResourceDto {
  const id = String(doc._id);
  return {
    _id: id,
    courseId: String(doc.course),
    lessonId: String(doc.lesson),
    originalFilename: doc.originalFilename,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    uploadedBy: String(doc.uploadedBy),
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    downloadPath: `/api/resources/${id}/download`,
  };
}

async function getCourseOrThrow(id: string): Promise<ICourse> {
  const course = await Course.findById(id);
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

/**
 * File access is stricter than course metadata browse:
 * managers (admin / coordinator / assigned ustad) or actively enrolled students.
 */
export async function assertCanViewCourse(actor: AcademicActor, courseId: string): Promise<ICourse> {
  const course = await getCourseOrThrow(courseId);
  if (canManageCourse(actor, course)) return course;
  if (
    actor.role === 'student' &&
    course.status === 'published' &&
    (await Enrollment.exists({ student: actor.id, course: course._id, status: 'active' }))
  ) {
    return course;
  }
  throw new AppError('You do not have permission to access this course', 403);
}

async function assertCourseManager(actor: AcademicActor, courseId: string): Promise<ICourse> {
  const course = await getCourseOrThrow(courseId);
  if (!canManageCourse(actor, course)) {
    throw new AppError('You do not have permission to manage this course', 403);
  }
  return course;
}

function resolveMime(buffer: Buffer, declared?: string): AllowedMimeType {
  const detected = detectMimeFromBuffer(buffer);
  if (!detected) {
    throw new AppError(
      'File content could not be verified as an allowed type (PDF, image, audio, or video)',
      400,
    );
  }
  if (declared && isAllowedMimeType(declared) && declared !== detected) {
    // webm container can be audio or video; accept either declared when EBML detected
    const webmOk =
      detected === 'video/webm' && (declared === 'video/webm' || declared === 'audio/webm');
    if (!webmOk) {
      throw new AppError('Declared Content-Type does not match file contents', 400);
    }
    return declared === 'audio/webm' ? 'audio/webm' : detected;
  }
  return detected;
}

export async function uploadLessonResource(
  actor: AcademicActor,
  lessonId: string,
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number } | undefined,
) {
  if (!file || !file.buffer?.length) throw new AppError('File is required', 400);

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);

  await assertCourseManager(actor, String(lesson.course));

  const mime = resolveMime(file.buffer, file.mimetype);
  const ext = MIME_TO_EXTENSION[mime];
  const storedKey = `${randomUUID()}${ext}`;
  const displayName = sanitizeDisplayFilename(file.originalname);

  const storage = getStorageProvider();
  await storage.put(storedKey, file.buffer);

  try {
    const doc = await LearningResource.create({
      course: lesson.course,
      lesson: lesson._id,
      originalFilename: displayName,
      storedKey,
      mimeType: mime,
      sizeBytes: file.buffer.length,
      uploadedBy: actor.id,
      status: 'active',
    });
    return toDto(doc);
  } catch (err) {
    await storage.delete(storedKey);
    throw err;
  }
}

export async function listLessonResources(actor: AcademicActor, lessonId: string) {
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new AppError('Lesson not found', 404);
  await assertCanViewCourse(actor, String(lesson.course));
  const rows = await LearningResource.find({ lesson: lessonId, status: 'active' }).sort('-createdAt');
  return rows.map(toDto);
}

export async function getResourceMeta(actor: AcademicActor, resourceId: string) {
  const doc = await LearningResource.findById(resourceId);
  if (!doc || doc.status === 'deleted') throw new AppError('Resource not found', 404);
  await assertCanViewCourse(actor, String(doc.course));
  return toDto(doc);
}

export async function openResourceDownload(actor: AcademicActor, resourceId: string) {
  const doc = await LearningResource.findById(resourceId);
  if (!doc || doc.status === 'deleted') throw new AppError('Resource not found', 404);
  await assertCanViewCourse(actor, String(doc.course));
  const stream = await getStorageProvider().openReadStream(doc.storedKey);
  return {
    stream,
    mimeType: doc.mimeType,
    filename: doc.originalFilename,
    sizeBytes: doc.sizeBytes,
  };
}

/**
 * Soft-delete metadata and remove the blob immediately.
 * Downloads after delete return 404.
 */
export async function deleteResource(actor: AcademicActor, resourceId: string) {
  const doc = await LearningResource.findById(resourceId);
  if (!doc || doc.status === 'deleted') throw new AppError('Resource not found', 404);
  await assertCourseManager(actor, String(doc.course));

  doc.status = 'deleted';
  doc.deletedAt = new Date();
  await doc.save();
  await getStorageProvider().delete(doc.storedKey);
  return { _id: String(doc._id), status: 'deleted' as const };
}
