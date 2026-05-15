import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../app/(auth)/forgot-password/page';
import { api } from '../lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const mockPush = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush, replace: jest.fn() });
});

describe('ForgotPasswordPage', () => {
  it('renders email input and submit button', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByPlaceholderText(/admin@fazn.dev/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
  });

  it('shows error for empty email', async () => {
    render(<ForgotPasswordPage />);
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await waitFor(() => expect(screen.getByText(/email is required/i)).toBeInTheDocument());
  });

  it('shows error for invalid email', async () => {
    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'notvalid');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));
    await waitFor(() => expect(screen.getByText(/invalid email/i)).toBeInTheDocument());
  });

  it('calls api and redirects to reset-password on success', async () => {
    (api.auth.forgotPassword as jest.Mock).mockResolvedValue({ message: 'sent' });

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'admin@fazn.dev');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      expect(api.auth.forgotPassword).toHaveBeenCalledWith('admin@fazn.dev');
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/reset-password'));
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('shows toast error on API failure', async () => {
    (api.auth.forgotPassword as jest.Mock).mockRejectedValue(new Error('fail'));

    render(<ForgotPasswordPage />);
    await userEvent.type(screen.getByPlaceholderText(/admin@fazn.dev/i), 'admin@fazn.dev');
    fireEvent.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it('has a link back to login', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
  });
});
