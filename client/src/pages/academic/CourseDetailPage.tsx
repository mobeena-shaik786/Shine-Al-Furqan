import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { useAuth } from '../../context/AuthContext';
import {
  createEnrollment,
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  getCourse,
  getCourseProgress,
  listEnrollments,
  listLessons,
  listModules,
  listStudents,
  updateLesson,
  updateLessonProgress,
  type CourseDto,
  type CourseProgressDto,
  type EnrollmentDto,
  type LessonDto,
  type ModuleDto,
} from '../../services/academicApi';
import { QuizPanel } from '../../components/academic/QuizPanel';
import { LessonResourcesPanel } from '../../components/academic/LessonResourcesPanel';
import { cn } from '../../lib/utils';

export function CourseDetailPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const canManage = user?.role === 'admin' || user?.role === 'coordinator' || user?.role === 'ustad';

  const [course, setCourse] = useState<CourseDto | null>(null);
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [progress, setProgress] = useState<CourseProgressDto | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDto[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [c, mods, less] = await Promise.all([getCourse(id), listModules(id), listLessons(id)]);
      setCourse(c);
      setModules(mods);
      setLessons(less);
      setSelectedLessonId((prev) => prev ?? less[0]?._id ?? null);
      if (isStudent) {
        setProgress(await getCourseProgress(id));
      }
      if (user?.role === 'admin' || user?.role === 'coordinator') {
        setEnrollments(await listEnrollments({ courseId: id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load course');
    } finally {
      setLoading(false);
    }
  }, [id, isStudent, user?.role]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedLesson = useMemo(
    () => lessons.find((l) => l._id === selectedLessonId) ?? null,
    [lessons, selectedLessonId],
  );

  const lessonsByModule = useMemo(() => {
    const map = new Map<string, LessonDto[]>();
    for (const lesson of lessons) {
      const list = map.get(lesson.moduleId) ?? [];
      list.push(lesson);
      map.set(lesson.moduleId, list);
    }
    return map;
  }, [lessons]);

  if (loading) return <p className="text-sm text-[#758188]">Loading course…</p>;
  if (error && !course) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[#E03040]">{error}</p>
        <Link to="/courses" className="text-sm font-semibold text-[#B01828]">
          Back to courses
        </Link>
      </div>
    );
  }
  if (!course) return null;

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={course.title}
        description={`${course.code} · ${course.category} · ${course.status}`}
        breadcrumbs={[
          { label: 'Courses', href: '/courses' },
          { label: course.title },
        ]}
      />
      {error ? <p className="text-sm text-[#E03040]">{error}</p> : null}
      {typeof course.progressPercent === 'number' || progress ? (
        <p className="text-sm font-semibold text-[#B01828]">
          Progress {(progress?.percent ?? course.progressPercent) ?? 0}%
          {progress
            ? ` (${progress.completedCount}/${progress.totalPublishedLessons} lessons)`
            : null}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card space-y-4 p-4">
          <h2 className="text-sm font-bold text-[#1E2531]">Curriculum</h2>
          {modules.length === 0 ? (
            <p className="text-xs text-[#758188]">No modules yet.</p>
          ) : (
            modules.map((mod) => (
              <div key={mod._id}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#758188]">
                    {mod.order}. {mod.title}
                  </p>
                  {canManage && !isStudent ? (
                    <button
                      type="button"
                      className="text-[10px] text-[#E03040]"
                      onClick={() =>
                        void deleteModule(mod._id)
                          .then(load)
                          .catch((e) => setError(e instanceof Error ? e.message : 'Delete failed'))
                      }
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
                <ul className="space-y-1">
                  {(lessonsByModule.get(mod._id) ?? []).map((lesson) => {
                    const done = progress?.lessons?.[lesson._id]?.completed;
                    return (
                      <li key={lesson._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLessonId(lesson._id)}
                          className={cn(
                            'w-full rounded-lg px-2.5 py-2 text-left text-sm transition',
                            selectedLessonId === lesson._id
                              ? 'bg-[#B01828] text-[#F8F8F8]'
                              : 'hover:bg-[#E9EEF0] text-[#1E2531]',
                          )}
                        >
                          {lesson.order}. {lesson.title}
                          {done ? ' ✓' : ''}
                          {!isStudent ? (
                            <span className="ml-1 text-[10px] opacity-70">({lesson.status})</span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}

          {canManage && !isStudent ? (
            <StaffCurriculumTools
              courseId={course._id}
              modules={modules}
              onChanged={load}
              onError={setError}
            />
          ) : null}
        </aside>

        <section className="card p-5 sm:p-6">
          {!selectedLesson ? (
            <p className="text-sm text-[#758188]">Select a lesson to view.</p>
          ) : (
            <LessonPanel
              lesson={selectedLesson}
              isStudent={Boolean(isStudent)}
              canManage={Boolean(canManage) && !isStudent}
              completed={Boolean(progress?.lessons?.[selectedLesson._id]?.completed)}
              onRefresh={load}
              onError={setError}
            />
          )}
        </section>
      </div>

      {(user?.role === 'admin' || user?.role === 'coordinator') && (
        <EnrollmentPanel
          courseId={course._id}
          enrollments={enrollments}
          coursePublished={course.status === 'published'}
          onChanged={load}
          onError={setError}
        />
      )}
    </div>
  );
}

function LessonPanel({
  lesson,
  isStudent,
  canManage,
  completed,
  onRefresh,
  onError,
}: {
  lesson: LessonDto;
  isStudent: boolean;
  canManage: boolean;
  completed: boolean;
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [content, setContent] = useState(lesson.content);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(lesson.content);
  }, [lesson]);

  useEffect(() => {
    if (!isStudent) return;
    void updateLessonProgress(lesson._id, false).catch(() => undefined);
  }, [isStudent, lesson._id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#1E2531]">{lesson.title}</h2>
          <p className="mt-1 text-xs uppercase tracking-wide text-[#758188]">
            {lesson.lessonType}
            {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isStudent ? (
            <button
              type="button"
              disabled={completed}
              className="rounded-xl bg-[#B01828] px-4 py-2 text-sm font-semibold text-[#F8F8F8] disabled:opacity-50"
              onClick={() =>
                void updateLessonProgress(lesson._id, true)
                  .then(onRefresh)
                  .catch((e) => onError(e instanceof Error ? e.message : 'Progress failed'))
              }
            >
              {completed ? 'Completed' : 'Mark complete'}
            </button>
          ) : null}
          {canManage ? (
            <>
              <button
                type="button"
                className="rounded-xl border border-[#E4DFE5] px-3 py-2 text-xs font-semibold"
                onClick={() =>
                  void updateLesson(lesson._id, {
                    status: lesson.status === 'published' ? 'draft' : 'published',
                  })
                    .then(onRefresh)
                    .catch((e) => onError(e instanceof Error ? e.message : 'Update failed'))
                }
              >
                {lesson.status === 'published' ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#E4DFE5] px-3 py-2 text-xs font-semibold text-[#E03040]"
                onClick={() =>
                  void deleteLesson(lesson._id)
                    .then(onRefresh)
                    .catch((e) => onError(e instanceof Error ? e.message : 'Delete failed'))
                }
              >
                Delete
              </button>
            </>
          ) : null}
        </div>
      </div>

      {lesson.resourceUrl ? (
        <a
          href={lesson.resourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-[#B01828] underline"
        >
          Open external resource
        </a>
      ) : null}

      {lesson.lessonType !== 'quiz' ? (
        <LessonResourcesPanel lessonId={lesson._id} canManage={canManage} onError={onError} />
      ) : null}

      {lesson.lessonType === 'quiz' ? (
        <QuizPanel
          lessonId={lesson._id}
          isStudent={isStudent}
          canManage={canManage}
          onError={onError}
        />
      ) : canManage ? (
        <div className="space-y-2">
          <textarea
            className="min-h-48 w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] p-3 text-sm outline-none focus:border-[#E03040]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="button"
            disabled={saving}
            className="rounded-xl bg-[#B01828] px-4 py-2 text-sm font-semibold text-[#F8F8F8]"
            onClick={() => {
              setSaving(true);
              void updateLesson(lesson._id, { content })
                .then(onRefresh)
                .catch((e) => onError(e instanceof Error ? e.message : 'Save failed'))
                .finally(() => setSaving(false));
            }}
          >
            {saving ? 'Saving…' : 'Save content'}
          </button>
        </div>
      ) : (
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#1E2531]">
          {lesson.content || 'No content yet.'}
        </div>
      )}
    </div>
  );
}

function StaffCurriculumTools({
  courseId,
  modules,
  onChanged,
  onError,
}: {
  courseId: string;
  modules: ModuleDto[];
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [moduleTitle, setModuleTitle] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'text' | 'quiz'>('text');
  const [moduleId, setModuleId] = useState(modules[0]?._id ?? '');

  useEffect(() => {
    if (!moduleId && modules[0]) setModuleId(modules[0]._id);
  }, [modules, moduleId]);

  return (
    <div className="space-y-3 border-t border-[#E9EEF0] pt-3">
      <div className="space-y-2">
        <input
          className={inputClass}
          placeholder="New module title"
          value={moduleTitle}
          onChange={(e) => setModuleTitle(e.target.value)}
        />
        <button
          type="button"
          className="w-full rounded-xl bg-[#B01828] py-2 text-xs font-semibold text-[#F8F8F8]"
          onClick={() =>
            void createModule(courseId, { title: moduleTitle.trim(), order: modules.length + 1 })
              .then(() => {
                setModuleTitle('');
                return onChanged();
              })
              .catch((e) => onError(e instanceof Error ? e.message : 'Module create failed'))
          }
        >
          Add module
        </button>
      </div>
      <div className="space-y-2">
        <select
          className={inputClass}
          value={moduleId}
          onChange={(e) => setModuleId(e.target.value)}
          aria-label="Module for new lesson"
        >
          {modules.map((m) => (
            <option key={m._id} value={m._id}>
              {m.title}
            </option>
          ))}
        </select>
        <input
          className={inputClass}
          placeholder="New lesson title"
          value={lessonTitle}
          onChange={(e) => setLessonTitle(e.target.value)}
        />
        <select
          className={inputClass}
          value={lessonType}
          onChange={(e) => setLessonType(e.target.value as 'text' | 'quiz')}
          aria-label="Lesson type"
        >
          <option value="text">Text lesson</option>
          <option value="quiz">Quiz lesson</option>
        </select>
        <button
          type="button"
          disabled={!moduleId}
          className="w-full rounded-xl border border-[#E4DFE5] py-2 text-xs font-semibold disabled:opacity-50"
          onClick={() => {
            void listLessons(courseId)
              .then((all) => {
                const count = all.filter((l) => l.moduleId === moduleId).length;
                return createLesson(moduleId, {
                  title: lessonTitle.trim(),
                  order: count + 1,
                  status: 'draft',
                  content: '',
                  lessonType,
                });
              })
              .then(() => {
                setLessonTitle('');
                return onChanged();
              })
              .catch((e) => onError(e instanceof Error ? e.message : 'Lesson create failed'));
          }}
        >
          Add lesson
        </button>
      </div>
    </div>
  );
}

function EnrollmentPanel({
  courseId,
  enrollments,
  coursePublished,
  onChanged,
  onError,
}: {
  courseId: string;
  enrollments: EnrollmentDto[];
  coursePublished: boolean;
  onChanged: () => Promise<void>;
  onError: (msg: string) => void;
}) {
  const [students, setStudents] = useState<Array<{ _id: string; name: string; email: string }>>([]);
  const [studentId, setStudentId] = useState('');

  useEffect(() => {
    void listStudents()
      .then(setStudents)
      .catch(() => setStudents([]));
  }, []);

  return (
    <section className="card p-5">
      <h2 className="text-sm font-bold text-[#1E2531]">Enrollments</h2>
      {!coursePublished ? (
        <p className="mt-2 text-sm text-[#758188]">Publish the course before enrolling students.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select
            className={cn(inputClass, 'sm:flex-1')}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            aria-label="Select student"
          >
            <option value="">Select student…</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={!studentId}
            className="rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] disabled:opacity-50"
            onClick={() =>
              void createEnrollment({ studentId, courseId })
                .then(() => {
                  setStudentId('');
                  return onChanged();
                })
                .catch((e) => onError(e instanceof Error ? e.message : 'Enroll failed'))
            }
          >
            Enroll
          </button>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {enrollments.length === 0 ? (
          <li className="text-sm text-[#758188]">No enrollments yet.</li>
        ) : (
          enrollments.map((e) => (
            <li key={e._id} className="rounded-xl bg-[#E9EEF0] px-3 py-2 text-sm text-[#1E2531]">
              Student {e.studentId.slice(-6)} · {e.status}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

const inputClass =
  'w-full rounded-xl border border-[#E4DFE5] bg-[#F8F8F8] px-3 py-2 text-sm outline-none focus:border-[#E03040]';

export default CourseDetailPage;
