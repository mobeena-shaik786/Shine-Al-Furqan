export type UserRole = 'admin' | 'coordinator' | 'ustad' | 'student';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  alternatePhone?: string;
  workLocation?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  coordinator: '/coordinator/dashboard',
  ustad: '/ustad/dashboard',
  student: '/student/dashboard',
};

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrator',
  coordinator: 'Coordinator',
  ustad: 'Ustad',
  student: 'Student',
};

export function getRoleHome(role: UserRole): string {
  return ROLE_HOME[role] ?? '/login';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABEL[role] ?? role;
}

export function splitName(name: string): { firstName: string; lastName?: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'U' };
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}
