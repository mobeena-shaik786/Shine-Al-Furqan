import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const mockedUseAuth = vi.mocked(useAuth);

function renderWithAuth(ui: React.ReactElement, initialPath = '/secret') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/secret" element={ui} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute golden', () => {
  it('redirects unauthenticated users to /login', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      accessToken: null,
      loading: false,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      restoreSession: vi.fn(),
      refreshUser: vi.fn(),
    } as ReturnType<typeof useAuth>);

    renderWithAuth(<div>Secret Content</div>);
    expect(screen.getByText('Login Page')).toBeTruthy();
    expect(screen.queryByText('Secret Content')).toBeNull();
  });

  it('renders outlet when authenticated', () => {
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

    renderWithAuth(<div>Secret Content</div>);
    expect(screen.getByText('Secret Content')).toBeTruthy();
  });
});
