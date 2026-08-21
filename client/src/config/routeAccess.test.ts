import { describe, expect, it } from 'vitest';
import { canAccessPath, getRolesForPath } from './routeAccess';
import { getNavigationForRole, getQuickActionsForRole } from '../components/layout/navigation';
import type { UserRole } from '../types/auth';

const roles: UserRole[] = ['admin', 'coordinator', 'ustad', 'student'];

describe('routeAccess matrix', () => {
  it('denies students admin management and salary/settings paths', () => {
    for (const path of [
      '/users/admins',
      '/coordinators',
      '/ustads',
      '/students',
      '/salaries',
      '/settings',
      '/leads',
      '/fees',
      '/reports',
      '/admin/dashboard',
    ]) {
      expect(canAccessPath('student', path)).toBe(false);
    }
  });

  it('allows students learner-facing paths', () => {
    for (const path of [
      '/student/dashboard',
      '/courses',
      '/courses/abc',
      '/classes',
      '/attendance',
      '/certificates',
      '/notifications',
      '/profile',
    ]) {
      expect(canAccessPath('student', path)).toBe(true);
    }
  });

  it('allows coordinator students and leads but not salaries or admin users', () => {
    expect(canAccessPath('coordinator', '/students')).toBe(true);
    expect(canAccessPath('coordinator', '/leads')).toBe(true);
    expect(canAccessPath('coordinator', '/reports')).toBe(true);
    expect(canAccessPath('coordinator', '/salaries')).toBe(false);
    expect(canAccessPath('coordinator', '/users/admins')).toBe(false);
    expect(canAccessPath('coordinator', '/settings')).toBe(false);
  });

  it('uses longest-prefix matching for detail routes', () => {
    expect(getRolesForPath('/ustads/xyz')).toEqual(['admin']);
    expect(canAccessPath('admin', '/ustads/xyz')).toBe(true);
    expect(canAccessPath('ustad', '/ustads/xyz')).toBe(false);
  });

  it('admin can access every catalogued prefix', () => {
    for (const path of [
      '/admin/dashboard',
      '/settings',
      '/salaries',
      '/users/admins',
      '/profile',
    ]) {
      expect(canAccessPath('admin', path)).toBe(true);
    }
  });
});

describe('getNavigationForRole', () => {
  it('hides User Management from students and ustads', () => {
    expect(getNavigationForRole('student').some((i) => i.id === 'users')).toBe(false);
    expect(getNavigationForRole('ustad').some((i) => i.id === 'users')).toBe(false);
  });

  it('shows Students under User Management for coordinator only among staff children', () => {
    const users = getNavigationForRole('coordinator').find((i) => i.id === 'users');
    expect(users?.children?.map((c) => c.id)).toEqual(['students']);
  });

  it('shows full User Management to admin', () => {
    const users = getNavigationForRole('admin').find((i) => i.id === 'users');
    expect(users?.children?.map((c) => c.id)).toEqual([
      'admins',
      'coordinators',
      'ustads',
      'students',
    ]);
  });

  it('never includes hrefs the role cannot open', () => {
    for (const role of roles) {
      for (const item of getNavigationForRole(role)) {
        if (item.href) {
          expect(canAccessPath(role, item.href)).toBe(true);
        }
        for (const child of item.children ?? []) {
          expect(canAccessPath(role, child.href)).toBe(true);
        }
      }
    }
  });

  it('filters quick actions to accessible hrefs', () => {
    const studentActions = getQuickActionsForRole('student');
    expect(studentActions.every((a) => canAccessPath('student', a.href))).toBe(true);
    expect(studentActions.some((a) => a.href === '/leads')).toBe(false);
    expect(studentActions.some((a) => a.href === '/attendance')).toBe(true);
  });
});
