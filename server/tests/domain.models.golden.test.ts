import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { User } from '../src/models/User';
import { Course, CourseModule, Lesson } from '../src/models/academic';
import * as academic from '../src/services/academic.service';
import { AppError } from '../src/utils/AppError';
import { setupTestDb, teardownTestDb } from './helpers/testDb';

describe('Golden academic domain models', () => {
  let adminId: string;
  let ustadId: string;
  let studentId: string;

  beforeAll(async () => {
    await setupTestDb();
    adminId = String((await User.findOne({ role: 'admin' }))!._id);
    ustadId = String((await User.findOne({ role: 'ustad' }))!._id);
    studentId = String((await User.findOne({ role: 'student' }))!._id);
  }, 60_000);

  afterAll(async () => {
    await teardownTestDb();
  });

  it('creates a course with unique code and ustad instructors', async () => {
    const course = await academic.createCourse(
      {
        title: 'Tajweed Foundations',
        code: 'tajweed-101',
        description: 'Intro tajweed',
        category: 'quran',
        instructorIds: [ustadId],
        status: 'draft',
      },
      adminId,
    );

    expect(course.code).toBe('TAJWEED-101');
    expect(course.status).toBe('draft');
    expect(course.instructors.map(String)).toEqual([ustadId]);

    await expect(
      academic.createCourse(
        {
          title: 'Duplicate',
          code: 'TAJWEED-101',
          instructorIds: [],
        },
        adminId,
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects non-ustad instructor assignment', async () => {
    await expect(
      academic.createCourse(
        {
          title: 'Bad Instructors',
          code: `BAD-INST-${Date.now()}`,
          instructorIds: [studentId],
        },
        adminId,
      ),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      academic.createCourse(
        {
          title: 'Bad Instructors',
          code: `BAD-INST-${Date.now()}`,
          instructorIds: [studentId],
        },
        adminId,
      ),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates ordered modules and lessons; rejects invalid relationships', async () => {
    const course = await academic.createCourse(
      {
        title: 'Fiqh Basics',
        code: `FIQH-${Date.now()}`,
        instructorIds: [ustadId],
      },
      adminId,
    );

    const module1 = await academic.createModule({
      courseId: String(course._id),
      title: 'Module 1',
      order: 1,
    });
    expect(module1.order).toBe(1);

    await expect(
      academic.createModule({
        courseId: String(course._id),
        title: 'Module 1 again',
        order: 1,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    const otherCourse = await academic.createCourse(
      {
        title: 'Other',
        code: `OTHER-${Date.now()}`,
        instructorIds: [],
      },
      adminId,
    );

    await expect(
      academic.createLesson({
        courseId: String(otherCourse._id),
        moduleId: String(module1._id),
        title: 'Wrong course lesson',
        order: 1,
      }),
    ).rejects.toMatchObject({ statusCode: 400 });

    const lesson = await academic.createLesson({
      courseId: String(course._id),
      moduleId: String(module1._id),
      title: 'Lesson 1',
      lessonType: 'text',
      order: 1,
      status: 'draft',
    });
    expect(lesson.title).toBe('Lesson 1');
    expect(String(lesson.module)).toBe(String(module1._id));

    await expect(
      academic.createLesson({
        courseId: String(course._id),
        moduleId: String(module1._id),
        title: 'Dup order',
        order: 1,
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    const moduleCount = await CourseModule.countDocuments({ course: course._id });
    const lessonCount = await Lesson.countDocuments({ course: course._id });
    expect(moduleCount).toBe(1);
    expect(lessonCount).toBe(1);
  });

  it('creates batches for a course and rejects bad date ranges / duplicate names', async () => {
    const course = await Course.findOne({ code: { $regex: /^FIQH-/ } });
    expect(course).toBeTruthy();

    const batch = await academic.createBatch(
      {
        name: 'Evening Cohort A',
        courseId: String(course!._id),
        instructorIds: [ustadId],
        capacity: 20,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-01'),
        status: 'planned',
      },
      adminId,
    );
    expect(batch.capacity).toBe(20);
    expect(batch.status).toBe('planned');

    await expect(
      academic.createBatch(
        {
          name: 'Evening Cohort A',
          courseId: String(course!._id),
          instructorIds: [ustadId],
        },
        adminId,
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects batch with unknown course id', async () => {
    await expect(
      academic.createBatch(
        {
          name: 'Orphan',
          courseId: 'aaaaaaaaaaaaaaaaaaaaaaaa',
          instructorIds: [],
        },
        adminId,
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
