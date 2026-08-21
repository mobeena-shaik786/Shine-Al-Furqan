import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { RoleProtectedRoute } from '../components/RoleProtectedRoute';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getRoleHome, type UserRole } from '../types/auth';
import { RouteRoles } from '../config/routeAccess';
import { ComingSoonPage } from '../pages/ComingSoonPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { Login } from '../pages/auth/Login';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { Unauthorized } from '../pages/auth/Unauthorized';
import { FullPageLoader } from '../components/FullPageLoader';

const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const AdminManagementPage = lazy(() =>
  import('../pages/admin/AdminManagementPage').then((m) => ({ default: m.AdminManagementPage })),
);
const CoordinatorManagementPage = lazy(() =>
  import('../pages/admin/CoordinatorManagementPage').then((m) => ({
    default: m.CoordinatorManagementPage,
  })),
);
const UstadManagementPage = lazy(() =>
  import('../pages/admin/UstadManagementPage').then((m) => ({ default: m.UstadManagementPage })),
);
const StudentManagementPage = lazy(() =>
  import('../pages/admin/StudentManagementPage').then((m) => ({ default: m.StudentManagementPage })),
);
const LeadManagementPage = lazy(() =>
  import('../pages/admin/LeadManagementPage').then((m) => ({ default: m.LeadManagementPage })),
);
const SalaryManagementPage = lazy(() =>
  import('../pages/admin/SalaryManagementPage').then((m) => ({ default: m.SalaryManagementPage })),
);
const SystemSettingsPage = lazy(() =>
  import('../pages/admin/SystemSettingsPage').then((m) => ({ default: m.SystemSettingsPage })),
);
const AdminDashboard = lazy(() =>
  import('../pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const CoordinatorDashboard = lazy(() =>
  import('../pages/coordinator/CoordinatorDashboard').then((m) => ({
    default: m.CoordinatorDashboard,
  })),
);
const UstadDashboard = lazy(() =>
  import('../pages/ustad/UstadDashboard').then((m) => ({ default: m.UstadDashboard })),
);
const StudentDashboard = lazy(() =>
  import('../pages/student/StudentDashboard').then((m) => ({ default: m.StudentDashboard })),
);
const CoursesPage = lazy(() =>
  import('../pages/academic/CoursesPage').then((m) => ({ default: m.CoursesPage })),
);
const CourseDetailPage = lazy(() =>
  import('../pages/academic/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })),
);
const BatchesPage = lazy(() =>
  import('../pages/academic/BatchesPage').then((m) => ({ default: m.BatchesPage })),
);
const SyllabusPage = lazy(() =>
  import('../pages/academic/SyllabusPage').then((m) => ({ default: m.SyllabusPage })),
);
const CertificatesPage = lazy(() =>
  import('../pages/academic/CertificatesPage').then((m) => ({ default: m.CertificatesPage })),
);
const NotificationsPage = lazy(() =>
  import('../pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const AttendancePage = lazy(() =>
  import('../pages/academic/AttendancePage').then((m) => ({ default: m.AttendancePage })),
);

function RoleHomeRedirect() {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={getRoleHome(user.role)} replace />;
}

function withRoles(allowedRoles: readonly UserRole[], children: ReactNode) {
  return (
    <RoleProtectedRoute allowedRoles={[...allowedRoles]}>{children}</RoleProtectedRoute>
  );
}

function soon(title: string, description: string) {
  return <ComingSoonPage title={title} description={description} />;
}

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<FullPageLoader />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<RoleHomeRedirect />} />
          <Route path="/dashboard" element={<RoleHomeRedirect />} />

          <Route
            path="/admin/dashboard"
            element={withRoles(RouteRoles.adminDashboard, <Lazy><AdminDashboard /></Lazy>)}
          />
          <Route
            path="/coordinator/dashboard"
            element={withRoles(RouteRoles.coordinatorDashboard, <Lazy><CoordinatorDashboard /></Lazy>)}
          />
          <Route
            path="/ustad/dashboard"
            element={withRoles(RouteRoles.ustadDashboard, <Lazy><UstadDashboard /></Lazy>)}
          />
          <Route
            path="/student/dashboard"
            element={withRoles(RouteRoles.studentDashboard, <Lazy><StudentDashboard /></Lazy>)}
          />

          <Route
            path="/users/admins"
            element={withRoles(RouteRoles.adminUsers, <Lazy><AdminManagementPage /></Lazy>)}
          />
          <Route
            path="/coordinators"
            element={withRoles(RouteRoles.coordinators, <Lazy><CoordinatorManagementPage /></Lazy>)}
          />
          <Route
            path="/coordinators/:id"
            element={withRoles(
              RouteRoles.coordinators,
              soon('Coordinator Details', 'Coordinator profile and assignments.'),
            )}
          />
          <Route
            path="/ustads"
            element={withRoles(RouteRoles.ustads, <Lazy><UstadManagementPage /></Lazy>)}
          />
          <Route
            path="/ustads/:id"
            element={withRoles(
              RouteRoles.ustads,
              soon('Ustad Details', 'Ustad profile and assignments.'),
            )}
          />
          <Route path="/teachers" element={<Navigate to="/ustads" replace />} />
          <Route path="/teachers/:id" element={<Navigate to="/ustads" replace />} />
          <Route
            path="/students"
            element={withRoles(RouteRoles.students, <Lazy><StudentManagementPage /></Lazy>)}
          />
          <Route
            path="/students/:id"
            element={withRoles(
              RouteRoles.students,
              soon('Student Details', 'Student profile and academics.'),
            )}
          />
          <Route path="/parents" element={<Navigate to="/coordinators" replace />} />
          <Route
            path="/leads"
            element={withRoles(RouteRoles.leads, <Lazy><LeadManagementPage /></Lazy>)}
          />
          <Route
            path="/leads/:id"
            element={withRoles(
              RouteRoles.leads,
              soon('Lead Details', 'Lead timeline and follow-ups.'),
            )}
          />
          <Route
            path="/courses"
            element={withRoles(RouteRoles.courses, <Lazy><CoursesPage /></Lazy>)}
          />
          <Route
            path="/courses/:id"
            element={withRoles(RouteRoles.courses, <Lazy><CourseDetailPage /></Lazy>)}
          />
          <Route
            path="/syllabus"
            element={withRoles(RouteRoles.syllabus, <Lazy><SyllabusPage /></Lazy>)}
          />
          <Route path="/subjects" element={<Navigate to="/syllabus" replace />} />
          <Route
            path="/batches"
            element={withRoles(RouteRoles.batches, <Lazy><BatchesPage /></Lazy>)}
          />
          <Route
            path="/batches/:id"
            element={withRoles(
              RouteRoles.batches,
              soon('Batch Details', 'Batch roster and sessions.'),
            )}
          />
          <Route
            path="/classes"
            element={withRoles(
              RouteRoles.classes,
              soon('Class Schedule', 'Upcoming and past class sessions.'),
            )}
          />
          <Route
            path="/attendance"
            element={withRoles(RouteRoles.attendance, <Lazy><AttendancePage /></Lazy>)}
          />
          <Route
            path="/fees"
            element={withRoles(
              RouteRoles.fees,
              soon('Fee Management', 'Invoices, collections, and overdue fees.'),
            )}
          />
          <Route
            path="/salaries"
            element={withRoles(RouteRoles.salaries, <Lazy><SalaryManagementPage /></Lazy>)}
          />
          <Route
            path="/certificates"
            element={withRoles(RouteRoles.certificates, <Lazy><CertificatesPage /></Lazy>)}
          />
          <Route
            path="/reenrollments"
            element={withRoles(
              RouteRoles.reenrollments,
              soon('Student Re-enrollment', 'Re-enroll returning students.'),
            )}
          />
          <Route
            path="/feedback"
            element={withRoles(
              RouteRoles.feedback,
              soon('Student Feedback', 'Ratings and comments from students.'),
            )}
          />
          <Route
            path="/reports"
            element={withRoles(
              RouteRoles.reports,
              soon('Reports', 'Academic, financial, and attendance reports.'),
            )}
          />
          <Route
            path="/notifications"
            element={withRoles(RouteRoles.notifications, <Lazy><NotificationsPage /></Lazy>)}
          />
          <Route
            path="/settings"
            element={withRoles(RouteRoles.settings, <Lazy><SystemSettingsPage /></Lazy>)}
          />
          <Route
            path="/profile"
            element={
              <Lazy>
                <ProfilePage />
              </Lazy>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
