import { FormEvent, useEffect, useState } from 'react';
import { AlertBanner } from './AlertBanner';
import { AlertViewport } from './AlertViewport';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';
import { CreateTaskPayload, Task } from '../types/task';

interface TaskFormProps {
  onSubmit: (
    payload: CreateTaskPayload | { tasks: CreateTaskPayload[] },
  ) => Promise<void>;
  editingTask?: Task | null;
  onCancelEdit: () => void;
  error?: string | null;
  feedback?: string | null;
}

const emptyTask: CreateTaskPayload = {
  title: '',
  description: '',
  date: '',
  hour: '',
};

const bulkExamples = [
  'Planejar sprint | Alinhar backlog com o time | 2026-05-12 | 14:00',
  'Enviar relatorio | 2026-05-13 | 09:30',
];

const toLocalInputDate = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const isScheduleInPast = (date: string, hour: string): boolean => {
  const scheduledFor = new Date(`${date}T${hour}:00`);

  return (
    !Number.isNaN(scheduledFor.getTime()) && scheduledFor.getTime() < Date.now()
  );
};

const validateTaskSchedule = (
  task: CreateTaskPayload,
  lineNumber?: number,
): void => {
  if (!task.date || !task.hour) {
    return;
  }

  if (isScheduleInPast(task.date, task.hour)) {
    if (lineNumber) {
      throw new Error(`Line ${lineNumber} cannot be scheduled in the past`);
    }

    throw new Error('Task schedule cannot be in the past');
  }
};

const parseBulkLine = (line: string, index: number): CreateTaskPayload => {
  const segments = line.split('|').map((segment) => segment.trim());

  if (segments.length === 3) {
    const [title, date, hour] = segments;
    if (!title || !date || !hour) {
      throw new Error(`Line ${index + 1} is incomplete`);
    }

    return { title, date, hour };
  }

  if (segments.length === 4) {
    const [title, description, date, hour] = segments;
    if (!title || !date || !hour) {
      throw new Error(`Line ${index + 1} is incomplete`);
    }

    return {
      title,
      description: description || undefined,
      date,
      hour,
    };
  }

  throw new Error(
    `Line ${index + 1} must follow "Title | Description | YYYY-MM-DD | HH:MM"`,
  );
};

export const TaskForm = ({
  onSubmit,
  editingTask,
  onCancelEdit,
  error: _error,
  feedback: _feedback,
}: TaskFormProps): JSX.Element => {
  const [form, setForm] = useState<CreateTaskPayload>(emptyTask);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const minDate = toLocalInputDate(new Date());

  useAutoDismissMessage(clientError, setClientError);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title,
        description: editingTask.description,
        date: editingTask.date,
        hour: editingTask.hour,
        isFinished: editingTask.isFinished,
      });
      setBulkMode(false);
    } else {
      setForm(emptyTask);
    }
    setClientError(null);
  }, [editingTask]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setClientError(null);

    let payload: CreateTaskPayload | { tasks: CreateTaskPayload[] };

    try {
      if (bulkMode && !editingTask) {
        const tasks = bulkText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, index) => parseBulkLine(line, index));

        tasks.forEach((task, index) => validateTaskSchedule(task, index + 1));
        payload = { tasks };
      } else {
        validateTaskSchedule(form);
        payload = form;
      }
    } catch (caughtError) {
      setClientError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Invalid task schedule',
      );
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(payload);

      if ('tasks' in payload) {
        setBulkText('');
        return;
      }

      setForm(emptyTask);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>{editingTask ? 'Edit task' : 'Create task'}</h2>
          <p className="muted">
            {editingTask
              ? 'Update the selected task'
              : 'Plan what needs to happen next'}
          </p>
        </div>
        {!editingTask ? (
          <div className="segmented">
            <button
              className={!bulkMode ? 'active' : ''}
              onClick={() => {
                setBulkMode(false);
                setClientError(null);
              }}
              type="button"
            >
              Single
            </button>
            <button
              className={bulkMode ? 'active' : ''}
              onClick={() => {
                setBulkMode(true);
                setClientError(null);
              }}
              type="button"
            >
              Bulk
            </button>
          </div>
        ) : null}
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        {clientError ? (
          <AlertViewport>
            <AlertBanner message={clientError} variant="error" />
          </AlertViewport>
        ) : null}

        {bulkMode && !editingTask ? (
          <>
            <div className="helper-card">
              <strong>Expected format</strong>
              <p className="muted">
                One task per line. Use `|` to separate fields.
              </p>
              <code>{bulkExamples[0]}</code>
              <code>{bulkExamples[1]}</code>
            </div>
            <textarea
              className="textarea"
              placeholder={bulkExamples.join('\n')}
              value={bulkText}
              onChange={(event) => {
                setBulkText(event.target.value);
                setClientError(null);
              }}
            />
          </>
        ) : (
          <>
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => {
                  setClientError(null);
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }));
                }}
                required
              />
            </label>
            <label>
              <span>Description</span>
              <input
                value={form.description ?? ''}
                onChange={(event) => {
                  setClientError(null);
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }));
                }}
              />
            </label>
            <label>
              <span>Date</span>
              <input
                type="date"
                value={form.date}
                min={minDate}
                onChange={(event) => {
                  setClientError(null);
                  setForm((current) => ({
                    ...current,
                    date: event.target.value,
                  }));
                }}
                required
              />
            </label>
            <label>
              <span>Hour</span>
              <input
                type="time"
                value={form.hour}
                onChange={(event) => {
                  setClientError(null);
                  setForm((current) => ({
                    ...current,
                    hour: event.target.value,
                  }));
                }}
                required
              />
            </label>
          </>
        )}

        <div className="form-actions">
          {editingTask ? (
            <button
              className="ghost-button"
              onClick={onCancelEdit}
              type="button"
            >
              Cancel
            </button>
          ) : null}
          <button
            className="primary-button"
            disabled={submitting}
            type="submit"
          >
            {editingTask
              ? 'Save task'
              : bulkMode
                ? 'Queue tasks'
                : 'Create task'}
          </button>
        </div>
      </form>
    </section>
  );
};
