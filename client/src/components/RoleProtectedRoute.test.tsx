import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleProtectedRoute } from './RoleProtectedRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

function renderRoleGate(allowedRoles: Array<'admin' | 'coordinator' | 'ustad' | 'student'>) {
  return render(
    <MemoryRouter initialEntries={['/admin-only']}>
      <Routes>
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/admin-only"
          element={
            <RoleProtectedRoute allowedRoles={allowedRoles}>
              <div>Admin Only Content</div>
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoleProtectedRoute golden', () => {
  it('redirects wrong role to /unauthorized', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        _id: '2',
        name: 'Student',
        email: 's@example.com',
        role: 'student',
      },
      accessToken: 'token',
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn(),
      refreshUser: vi.fn(),
    } as ReturnType<typeof useAuth>);

    renderRoleGate(['admin']);
    expect(screen.getByText('Unauthorized Page')).toBeTruthy();
    expect(screen.queryByText('Admin Only Content')).toBeNull();
  });

  it('renders children for allowed role', () => {
    mockedUseAuth.mockReturnValue({
      user: {
        _id: '1',
        name: 'Admin',
        email: 'a@example.com',
        role: 'admin',
      },
      accessToken: 'token',
      loading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn(),
      refreshUser: vi.fn(),
    } as ReturnType<typeof useAuth>);

    renderRoleGate(['admin']);
    expect(screen.getByText('Admin Only Content')).toBeTruthy();
  });
});
