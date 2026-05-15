import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GamesPage from '../app/(dashboard)/games/page';
import { api, ApiError } from '../lib/api';
import { toast } from 'sonner';

const game = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'g1',
  name: 'Chess',
  slug: 'chess',
  category: 'Board',
  platforms: ['web', 'mobile'],
  thumbnail_url: null,
  score_type: 'win_loss',
  active: true,
  created_by: null,
  created_at: '2026-01-01T00:00:00.000Z',
  ...over,
});

const options = {
  categories: ['Board', 'Arcade'],
  platforms: ['web', 'mobile'],
  scoreTypes: ['numeric', 'win_loss', 'time'],
};

beforeEach(() => {
  jest.clearAllMocks();
  (api.games.options as jest.Mock).mockResolvedValue(options);
});

describe('GamesPage', () => {
  it('renders loading skeleton initially', () => {
    (api.games.list as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<GamesPage />);
    expect(screen.getByLabelText(/loading games/i)).toBeInTheDocument();
  });

  it('renders games list after load', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([game()]);
    render(<GamesPage />);
    expect(await screen.findByText('Chess')).toBeInTheDocument();
    expect(screen.getByText('Board')).toBeInTheDocument();
    expect(screen.getByText('web')).toBeInTheDocument();
    expect(screen.getByText(/win \/ loss/i)).toBeInTheDocument();
  });

  it('shows empty state when no games', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([]);
    render(<GamesPage />);
    expect(await screen.findByText(/no games yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create first game/i })).toBeInTheDocument();
  });

  it('shows error state and retry button on API failure', async () => {
    (api.games.list as jest.Mock).mockRejectedValue(new ApiError('SERVER', 'boom', 500));
    render(<GamesPage />);
    expect(await screen.findByText(/couldn.t load games/i)).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /retry/i });

    (api.games.list as jest.Mock).mockResolvedValue([game()]);
    fireEvent.click(retry);
    expect(await screen.findByText('Chess')).toBeInTheDocument();
  });

  it('opens create modal on button click', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([game()]);
    render(<GamesPage />);
    await screen.findByText('Chess');
    fireEvent.click(screen.getByRole('button', { name: /new game/i }));
    expect(await screen.findByRole('dialog', { name: /create game/i })).toBeInTheDocument();
  });

  it('validates form and shows errors for empty fields', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([]);
    render(<GamesPage />);
    await screen.findByText(/no games yet/i);
    fireEvent.click(screen.getByRole('button', { name: /^new game$/i }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /create game/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/category is required/i)).toBeInTheDocument();
      expect(screen.getByText(/select at least one platform/i)).toBeInTheDocument();
      expect(screen.getByText(/score type is required/i)).toBeInTheDocument();
    });
    expect(api.games.create).not.toHaveBeenCalled();
  });

  it('calls api.games.create with correct data on valid submit', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([]);
    (api.games.create as jest.Mock).mockResolvedValue(game({ id: 'g2', name: 'Pong' }));
    render(<GamesPage />);
    await screen.findByText(/no games yet/i);
    fireEvent.click(screen.getByRole('button', { name: /^new game$/i }));
    await screen.findByRole('dialog');

    await userEvent.type(screen.getByLabelText('Name'), 'Pong');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Arcade');
    fireEvent.click(screen.getByRole('checkbox', { name: 'web' }));
    await userEvent.selectOptions(screen.getByLabelText('Score type'), 'numeric');

    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() =>
      expect(api.games.create).toHaveBeenCalledWith({
        name: 'Pong',
        category: 'Arcade',
        platforms: ['web'],
        scoreType: 'numeric',
      }),
    );
  });

  it('shows toast success and closes modal after create', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([]);
    (api.games.create as jest.Mock).mockResolvedValue(game({ id: 'g2', name: 'Pong' }));
    render(<GamesPage />);
    await screen.findByText(/no games yet/i);
    fireEvent.click(screen.getByRole('button', { name: /^new game$/i }));
    await screen.findByRole('dialog');

    await userEvent.type(screen.getByLabelText('Name'), 'Pong');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Arcade');
    fireEvent.click(screen.getByRole('checkbox', { name: 'web' }));
    await userEvent.selectOptions(screen.getByLabelText('Score type'), 'numeric');
    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Pong created'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Pong')).toBeInTheDocument();
  });

  it('shows toast error if create fails', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([]);
    (api.games.create as jest.Mock).mockRejectedValue(new ApiError('BAD', 'Slug taken', 409));
    render(<GamesPage />);
    await screen.findByText(/no games yet/i);
    fireEvent.click(screen.getByRole('button', { name: /^new game$/i }));
    await screen.findByRole('dialog');

    await userEvent.type(screen.getByLabelText('Name'), 'Pong');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Arcade');
    fireEvent.click(screen.getByRole('checkbox', { name: 'web' }));
    await userEvent.selectOptions(screen.getByLabelText('Score type'), 'numeric');
    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Slug taken'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('toggles game active status and calls api.games.toggle', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([game({ active: true })]);
    (api.games.toggle as jest.Mock).mockResolvedValue(game({ active: false }));
    render(<GamesPage />);
    await screen.findByText('Chess');

    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);

    await waitFor(() => expect(api.games.toggle).toHaveBeenCalledWith('g1', false));
    await waitFor(() => expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false'));
  });

  it('rolls back toggle on api failure', async () => {
    (api.games.list as jest.Mock).mockResolvedValue([game({ active: true })]);
    (api.games.toggle as jest.Mock).mockRejectedValue(new ApiError('X', 'fail', 500));
    render(<GamesPage />);
    await screen.findByText('Chess');

    fireEvent.click(screen.getByRole('switch'));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Could not update game status'));
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });
});
