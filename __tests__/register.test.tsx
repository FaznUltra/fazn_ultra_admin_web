import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../app/(auth)/register/page';
import { api, ApiError } from '../lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn() });
});

async function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const vals = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'new@fazn.dev',
    username: 'johndoe',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    ...overrides,
  };
  const inputs = screen.getAllByRole('textbox');
  await userEvent.type(inputs[0], vals.firstName);
  await userEvent.type(inputs[1], vals.lastName);
  await userEvent.type(inputs[2], vals.email);
  await userEvent.type(inputs[3], vals.username);

  const passwords = screen.getAllByPlaceholderText(/••••••••/i);
  await userEvent.type(passwords[0], vals.password);
  await userEvent.type(passwords[1], vals.confirmPassword);
}

describe('RegisterPage', () => {
  it('renders all fields', () => {
    render(<RegisterPage />);
    expect(screen.getByPlaceholderText(/john/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@fazn.dev/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/adminuser/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/••••••••/i)).toHaveLength(2);
  });

  it('shows errors when submitting empty form', async () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage />);
    await fillForm({ confirmPassword: 'DifferentPass' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument());
  });

  it('shows error for invalid username format', async () => {
    render(<RegisterPage />);
    await fillForm({ username: 'bad username!' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/3–32 chars/i)).toBeInTheDocument());
  });

  it('redirects to verify page on successful registration', async () => {
    (api.auth.register as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'new@fazn.dev', username: 'johndoe', first_name: 'John', last_name: 'Doe', role: 'player', email_verified: false, auth_provider: 'local' },
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    render(<RegisterPage />);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/register/verify')));
  });

  it('shows toast error for duplicate email/username', async () => {
    (api.auth.register as jest.Mock).mockRejectedValue(new ApiError('USER_EXISTS', 'Email or username already in use', 409));

    render(<RegisterPage />);
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email or username already in use'));
  });

  it('has a link to login page', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });
});
