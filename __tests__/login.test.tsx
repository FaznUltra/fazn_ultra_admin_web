import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../app/(auth)/login/page';
import { api, ApiError } from '../lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

const mockPush = jest.fn();
const mockGet = jest.fn(() => null);

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn() });
  (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
});

describe('LoginPage', () => {
  it('renders email, password fields and sign in button', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText(/admin@fazn.dev/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('shows invalid email error for bad email format', async () => {
    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'notanemail');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(screen.getByText(/invalid email/i)).toBeInTheDocument());
  });

  it('calls api.auth.login with correct values on submit', async () => {
    (api.auth.login as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'admin@fazn.dev', username: 'admin', first_name: 'Admin', last_name: 'User', role: 'admin', email_verified: true, auth_provider: 'local' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'admin@fazn.dev');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(api.auth.login).toHaveBeenCalledWith({ email: 'admin@fazn.dev', password: 'password123' }));
  });

  it('shows error and does not redirect for non-admin user', async () => {
    (api.auth.login as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'player@fazn.dev', username: 'player', first_name: 'Player', last_name: 'User', role: 'player', email_verified: true, auth_provider: 'local' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'player@fazn.dev');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Access denied — admin accounts only'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows invalid credentials error on 401', async () => {
    (api.auth.login as jest.Mock).mockRejectedValue(new ApiError('INVALID_CREDENTIALS', 'Invalid email or password', 401));

    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'admin@fazn.dev');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpassword');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument());
  });

  it('redirects to / on successful admin login', async () => {
    (api.auth.login as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'admin@fazn.dev', username: 'admin', first_name: 'Admin', last_name: 'User', role: 'admin', email_verified: true, auth_provider: 'local' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    render(<LoginPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'admin@fazn.dev');
    await userEvent.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  it('has a link to register page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /register/i })).toHaveAttribute('href', '/register');
  });

  it('has a link to forgot password page', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password');
  });
});
