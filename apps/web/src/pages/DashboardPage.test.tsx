import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/useAuth';
import {
  createTasks,
  deleteTask,
  listTasks,
  updateTask,
} from '../api/task-api';
import { DashboardPage } from './DashboardPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../api/task-api', () => ({
  listTasks: vi.fn(),
  createTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedListTasks = vi.mocked(listTasks);
const mockedCreateTasks = vi.mocked(createTasks);
const mockedUpdateTask = vi.mocked(updateTask);
const mockedDeleteTask = vi.mocked(deleteTask);

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-05-11T12:00:00.000Z').getTime(),
    );

    mockedUseAuth.mockReturnValue({
      authState: {
        token: 'token',
        user: {
          id: 'admin-1',
          username: 'alice',
          role: 'ADMIN',
        },
      },
      login: vi.fn(),
      logout: vi.fn(),
    });

    mockedListTasks.mockResolvedValue([
      {
        id: 'task-1',
        title: 'Prepare deck',
        description: 'Slides for demo day',
        date: '2026-05-12',
        hour: '15:00',
        scheduledFor: '2026-05-12T15:00:00.000Z',
        isFinished: false,
        ownerId: 'user-1',
        ownerName: 'Ana',
        createdAt: '2026-05-11T10:00:00.000Z',
        updatedAt: '2026-05-11T10:00:00.000Z',
      },
      {
        id: 'task-2',
        title: 'Write report',
        description: 'Weekly update',
        date: '2026-05-10',
        hour: '09:00',
        scheduledFor: '2026-05-10T09:00:00.000Z',
        isFinished: false,
        ownerId: 'user-2',
        ownerName: 'Bruno',
        createdAt: '2026-05-10T08:00:00.000Z',
        updatedAt: '2026-05-10T08:00:00.000Z',
      },
      {
        id: 'task-3',
        title: 'Close sprint',
        description: 'Review done work',
        date: '2026-05-09',
        hour: '18:00',
        scheduledFor: '2026-05-09T18:00:00.000Z',
        isFinished: true,
        ownerId: 'user-3',
        ownerName: 'Carla',
        createdAt: '2026-05-09T17:00:00.000Z',
        updatedAt: '2026-05-09T17:00:00.000Z',
      },
    ]);

    mockedCreateTasks.mockResolvedValue({ mode: 'created', createdCount: 1 });
    mockedUpdateTask.mockResolvedValue({
      id: 'task-1',
      title: 'Prepare deck',
      description: 'Slides for demo day',
      date: '2026-05-12',
      hour: '15:00',
      scheduledFor: '2026-05-12T15:00:00.000Z',
      isFinished: false,
      ownerId: 'user-1',
      ownerName: 'Ana',
      createdAt: '2026-05-11T10:00:00.000Z',
      updatedAt: '2026-05-11T10:00:00.000Z',
    });
    mockedDeleteTask.mockResolvedValue({ id: 'task-1' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads tasks, shows scheduled items separately, and refetches on status filter', async () => {
    const user = userEvent.setup();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(mockedListTasks).toHaveBeenCalledWith('token', {
        search: '',
        status: 'all',
      });
    });

    expect(await screen.findByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getAllByText('Prepare deck')).toHaveLength(2);
    expect(screen.getAllByText('Write report')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Finished' }));

    await waitFor(() => {
      expect(mockedListTasks).toHaveBeenLastCalledWith('token', {
        search: '',
        status: 'finished',
      });
    });
  });
});
