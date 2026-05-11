import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TaskForm } from './TaskForm';

const tomorrow = '2026-05-12';
const today = '2026-05-11';

describe('TaskForm', () => {
  it('blocks single task submission when the schedule is in the past', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2026-05-11T12:00:00.000Z').getTime(),
    );

    render(<TaskForm onSubmit={onSubmit} onCancelEdit={vi.fn()} />);

    await user.type(screen.getByLabelText('Title'), 'Retro');
    fireEvent.change(screen.getByLabelText('Date'), {
      target: { value: today },
    });
    fireEvent.change(screen.getByLabelText('Hour'), {
      target: { value: '08:00' },
    });

    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Task schedule cannot be in the past'),
    ).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it('parses bulk tasks and submits them together', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<TaskForm onSubmit={onSubmit} onCancelEdit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Bulk' }));

    const textarea = screen.getByRole('textbox');
    await user.type(
      textarea,
      [
        `Planejar sprint | Alinhar backlog | ${tomorrow} | 14:00`,
        `Enviar relatorio | ${tomorrow} | 09:30`,
      ].join('\n'),
    );

    await user.click(screen.getByRole('button', { name: 'Queue tasks' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        tasks: [
          {
            title: 'Planejar sprint',
            description: 'Alinhar backlog',
            date: tomorrow,
            hour: '14:00',
          },
          {
            title: 'Enviar relatorio',
            date: tomorrow,
            hour: '09:30',
          },
        ],
      });
    });

    expect(textarea).toHaveValue('');
  });
});
