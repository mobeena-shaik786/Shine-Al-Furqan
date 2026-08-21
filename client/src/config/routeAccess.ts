import type { UserRole } from '../types/auth';

/** All LMS roles (authenticated). */
export const ALL_ROLES: UserRole[] = ['admin', 'coordinator', 'ustad', 'student'];

export const ADMIN_ONLY: UserRole[] = ['admin'];

export const ADMIN_COORDINATOR: UserRole[] = ['admin', 'coordinator'];

export const STAFF: UserRole[] = ['admin', 'coordinator', 'ustad'];

/**
 * Longest-prefix route access table.
 * Direct URL entry and sidebar visibility both derive from this matrix.
 * Order does not matter; lookup sorts by prefix length.
 */
const ROUTE_ACCESS_TABLE: Array<{ prefix: string; roles: readonly UserRole[] }> = [
  { prefix: '/admin/dashboard', roles: ADMIN_ONLY },
  { prefix: '/coordinator/dashboard', roles: ADMIN_COORDINATOR },
  { prefix: '/ustad/dashboard', roles: STAFF },
  { prefix: '/student/dashboard', roles: ['student'] },

  { prefix: '/users/admins', roles: ADMIN_ONLY },
  { prefix: '/coordinators', roles: ADMIN_ONLY },
  { prefix: '/ustads', roles: ADMIN_ONLY },
  { prefix: '/students', roles: ADMIN_COORDINATOR },

  { prefix: '/leads', roles: ADMIN_COORDINATOR },
  { prefix: '/courses', roles: ALL_ROLES },
  { prefix: '/syllabus', roles: STAFF },
  { prefix: '/batches', roles: STAFF },
  { prefix: '/classes', roles: ALL_ROLES },
  { prefix: '/attendance', roles: ALL_ROLES },
  { prefix: '/certificates', roles: ALL_ROLES },

  { prefix: '/fees', roles: ADMIN_COORDINATOR },
  { prefix: '/salaries', roles: ADMIN_ONLY },
  { prefix: '/reenrollments', roles: ADMIN_COORDINATOR },
  { prefix: '/feedback', roles: STAFF },
  { prefix: '/reports', roles: ADMIN_COORDINATOR },
  { prefix: '/notifications', roles: ALL_ROLES },
  { prefix: '/settings', roles: ADMIN_ONLY },
  { prefix: '/profile', roles: ALL_ROLES },

  // Role-home redirect targets (any authenticated role may hit these)
  { prefix: '/dashboard', roles: ALL_ROLES },
];

const SORTED_ACCESS = [...ROUTE_ACCESS_TABLE].sort(
  (a, b) => b.prefix.length - a.prefix.length,
);

/** Roles allowed for a pathname, or null if the path is not in the matrix. */
export function getRolesForPath(pathname: string): readonly UserRole[] | null {
  const path = pathname.split('?')[0] || '/';
  const match = SORTED_ACCESS.find(
    (entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`),
  );
  return match?.roles ?? null;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const roles = getRolesForPath(pathname);
  if (!roles) return false;
  return roles.includes(role);
}

/** Named role sets for router wiring (mirrors table). */
export const RouteRoles = {
  adminDashboard: ADMIN_ONLY,
  coordinatorDashboard: ADMIN_COORDINATOR,
  ustadDashboard: STAFF,
  studentDashboard: ['student'] as UserRole[],
  adminUsers: ADMIN_ONLY,
  coordinators: ADMIN_ONLY,
  ustads: ADMIN_ONLY,
  students: ADMIN_COORDINATOR,
  leads: ADMIN_COORDINATOR,
  courses: ALL_ROLES,
  syllabus: STAFF,
  batches: STAFF,
  classes: ALL_ROLES,
  attendance: ALL_ROLES,
  certificates: ALL_ROLES,
  fees: ADMIN_COORDINATOR,
  salaries: ADMIN_ONLY,
  reenrollments: ADMIN_COORDINATOR,
  feedback: STAFF,
  reports: ADMIN_COORDINATOR,
  notifications: ALL_ROLES,
  settings: ADMIN_ONLY,
  profile: ALL_ROLES,
} as const;
