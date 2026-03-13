/* @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

import { useAuth } from './useAuth';

// Mock useAuth so we can control auth state in each test
jest.mock('./useAuth', () => ({
  useAuth: jest.fn(),
}));
const mockUseAuth = useAuth as jest.Mock;

function renderRoute(initialPath: string, permission = 'MANAGE_USERS' as any) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ProtectedRoute requiredPermission={permission} />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders outlet when user is authenticated and has the required permission', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { permissions: ['MANAGE_USERS'] },
    });

    renderRoute('/protected');
    expect(screen.queryByText('Protected Content')).not.toBeNull();
    expect(screen.queryByText('Login Page')).toBeNull();
  });

  it('redirects to /login when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    renderRoute('/protected');
    expect(screen.queryByText('Login Page')).not.toBeNull();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('redirects to /login when authenticated but lacks required permission', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { permissions: [] },
    });

    renderRoute('/protected');
    expect(screen.queryByText('Login Page')).not.toBeNull();
    expect(screen.queryByText('Protected Content')).toBeNull();
  });

  it('redirects when authenticated but permissions array is undefined', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { permissions: undefined },
    });

    renderRoute('/protected');
    expect(screen.queryByText('Login Page')).not.toBeNull();
  });

  it('renders outlet when user has multiple permissions including the required one', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { permissions: ['VIEW_CHARTS', 'MANAGE_USERS', 'EDIT_CHARTS'] },
    });

    renderRoute('/protected');
    expect(screen.queryByText('Protected Content')).not.toBeNull();
  });
});
