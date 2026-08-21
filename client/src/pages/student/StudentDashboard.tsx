import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchStudentDashboard, type StudentDashboardData } from '../../services/dashboardApi';

export function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchStudentDashboard()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const resume = data?.resumeCourse;

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="card p-6 sm:p-8">
        <p className="text-sm font-medium text-[#B01828]">Student workspace</p>
        <h1 className="text-gold-shine mt-1 text-2xl font-bold sm:text-3xl">
          Assalamu Alaikum, {user?.name}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {data?.message ?? 'Continue your enrolled courses and track progress.'}
        </p>
        {resume ? (
          <Link
            to={`/courses/${resume.courseId}`}
            className="mt-4 inline-flex rounded-xl bg-[#B01828] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] hover:bg-[#800810]"
          >
            Resume learning · {resume.title} ({resume.progressPercent}%)
          </Link>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="card p-5">
          <p className="text-sm text-[#758188]">Active enrollments</p>
          <p className="mt-1 text-3xl font-bold text-[#1E2531]">
            {loading ? '…' : (data?.metrics.activeEnrollments ?? 0)}
          </p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-[#758188]">Average progress</p>
          <p className="mt-1 text-3xl font-bold text-[#1E2531]">
            {loading ? '…' : `${data?.metrics.averageProgressPercent ?? 0}%`}
          </p>
        </article>
        <article className="card p-5">
          <p className="text-sm text-[#758188]">Quiz attempts</p>
          <p className="mt-1 text-3xl font-bold text-[#1E2531]">
            {loading ? '…' : (data?.metrics.quizAttemptsTotal ?? 0)}
          </p>
        </article>
      </section>

      <section className="card p-5">
        <h2 className="text-sm font-semibold text-[#1E2531]">My courses</h2>
        {loading ? <p className="mt-3 text-sm text-[#758188]">Loading…</p> : null}
        {error ? <p className="mt-3 text-sm text-[#E03040]">{error}</p> : null}
        {!loading && !error && (data?.courses.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-[#758188]">
            No enrollments yet. Ask a coordinator to enroll you.
          </p>
        ) : null}
        <ul className="mt-3 space-y-2">
          {data?.courses.map((course) => (
            <li key={course.enrollmentId}>
              <Link
                to={`/courses/${course.courseId}`}
                className="flex items-center justify-between rounded-xl bg-[#E9EEF0] px-3 py-3 text-sm text-[#1E2531] transition hover:bg-[#E4DFE5]"
              >
                <span className="font-semibold text-[#B01828]">{course.title}</span>
                <span className="text-xs text-[#758188]">{course.progressPercent}%</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {(data?.recentAttendance.length ?? 0) > 0 ? (
        <section className="card p-5">
          <h2 className="text-sm font-semibold text-[#1E2531]">Recent attendance</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#758188]">
            {data!.recentAttendance.map((row, i) => (
              <li key={`${row.sessionDate}-${i}`} className="rounded-xl bg-[#E9EEF0] px-3 py-2 capitalize">
                {row.sessionDate ?? '—'} · {row.status}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default StudentDashboard;
