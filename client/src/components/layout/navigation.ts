import {
  Bell,
  BookOpen,
  BookMarked,
  ClipboardCheck,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  Settings,
  UserCircle,
  Users,
  Wallet,
  Layers,
  UserRound,
  UserCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserRole } from '../../types/auth';
import { canAccessPath } from '../../config/routeAccess';

export interface NavChild {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: number;
  children?: NavChild[];
}

export const navigation: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    children: [
      { id: 'admins', label: 'Administrators', href: '/users/admins', icon: UserCog },
      { id: 'coordinators', label: 'Coordinators', href: '/coordinators', icon: Users },
      { id: 'ustads', label: 'Ustads', href: '/ustads', icon: GraduationCap },
      { id: 'students', label: 'Students', href: '/students', icon: UserRound },
    ],
  },
  { id: 'leads', label: 'Lead Management', href: '/leads', icon: FolderKanban },
  {
    id: 'academic',
    label: 'Academic Management',
    icon: BookOpen,
    children: [
      { id: 'courses', label: 'Courses', href: '/courses', icon: Library },
      { id: 'syllabus', label: 'Syllabus', href: '/syllabus', icon: BookMarked },
      { id: 'batches', label: 'Batches', href: '/batches', icon: Layers },
    ],
  },
  { id: 'attendance', label: 'Attendance Portal', href: '/attendance', icon: ClipboardCheck },
  { id: 'salaries', label: 'Salary Management', href: '/salaries', icon: Wallet },
  { id: 'settings', label: 'System Settings', href: '/settings', icon: Settings },
  { id: 'notifications', label: 'Notifications', href: '/notifications', icon: Bell },
  { id: 'profile', label: 'Profile', href: '/profile', icon: UserCircle },
];

export const quickActions = [
  { label: 'View Leads', href: '/leads', icon: FolderKanban, description: 'Track incoming inquiries' },
  { label: 'Manage Students', href: '/students', icon: UserRound, description: 'View and manage students' },
  { label: 'Batches', href: '/batches', icon: Layers, description: 'Seats and schedules' },
  { label: 'Attendance', href: '/attendance', icon: ClipboardCheck, description: 'Mark and review records' },
  { label: 'Reports', href: '/reports', icon: BookOpen, description: 'Academic reports' },
  { label: 'Notifications', href: '/notifications', icon: Bell, description: 'Alerts and updates' },
] as const;

/** Sidebar / menu items visible for a role (empty groups removed). */
export function getNavigationForRole(role: UserRole): NavItem[] {
  return navigation
    .map((item) => {
      if (item.children?.length) {
        const children = item.children.filter((child) => canAccessPath(role, child.href));
        if (children.length === 0) return null;
        return { ...item, children };
      }
      if (item.href && !canAccessPath(role, item.href)) return null;
      return item;
    })
    .filter((item): item is NavItem => item != null);
}

export function getQuickActionsForRole(role: UserRole) {
  return quickActions.filter((action) => canAccessPath(role, action.href));
}
