import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { LoginPage } from './LoginPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

describe('LoginPage', () => {
  it('submits credentials and surfaces API errors', async () => {
    const user = userEvent.setup();
    const login = vi
      .fn()
      .mockRejectedValue(new ApiClientError(401, 'Invalid credentials'));

    mockedUseAuth.mockReturnValue({
      authState: null,
      login,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter
        initialEntries={['/login']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Login'), 'john');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        login: 'john',
        password: 'secret',
      });
    });

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });

  it('redirects authenticated users to the dashboard', () => {
    mockedUseAuth.mockReturnValue({
      authState: {
        token: 'token',
        user: {
          id: 'user-1',
          username: 'john',
          role: 'BASIC',
        },
      },
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter
        initialEntries={['/login']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>Dashboard home</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Dashboard home')).toBeInTheDocument();
  });
});
