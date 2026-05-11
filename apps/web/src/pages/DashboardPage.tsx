import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createTasks,
  deleteTask,
  listTasks,
  updateTask,
} from '../api/task-api';
import { ApiClientError } from '../api/client';
import { AlertBanner } from '../components/AlertBanner';
import { AlertViewport } from '../components/AlertViewport';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { useAuth } from '../hooks/useAuth';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';
import { Task } from '../types/task';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Open' },
  { value: 'finished', label: 'Finished' },
  { value: 'scheduled', label: 'Scheduled' },
] as const;

export const DashboardPage = (): JSX.Element => {
  const { authState } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] =
    useState<(typeof statusOptions)[number]['value']>('all');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useAutoDismissMessage(formFeedback, setFormFeedback);
  useAutoDismissMessage(formError, setFormError);
  useAutoDismissMessage(listError, setListError);

  const loadTasks = useCallback(async () => {
    if (!authState) {
      return;
    }

    try {
      const nextTasks = await listTasks(authState.token, {
        search,
        status,
      });
      setTasks(nextTasks);
      setListError(null);
    } catch (caughtError) {
      setListError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Could not load tasks',
      );
    }
  }, [authState, search, status]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const scheduledTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !task.isFinished &&
          new Date(task.scheduledFor).getTime() > Date.now(),
      ),
    [tasks],
  );

  const handleCreateOrUpdate = async (
    payload:
      | {
          title: string;
          description?: string;
          date: string;
          hour: string;
          isFinished?: boolean;
        }
      | {
          tasks: Array<{
            title: string;
            description?: string;
            date: string;
            hour: string;
            isFinished?: boolean;
          }>;
        },
  ) => {
    if (!authState) {
      return;
    }

    try {
      setFormError(null);
      setFormFeedback(null);

      if (editingTask && !('tasks' in payload)) {
        await updateTask(authState.token, editingTask.id, payload);
        setFormFeedback('Task updated');
        setEditingTask(null);
      } else {
        const result = await createTasks(authState.token, payload);
        setFormFeedback(
          result.mode === 'queued'
            ? `${result.createdCount} tasks queued`
            : `${result.createdCount} ${
                result.createdCount === 1 ? 'task created' : 'tasks created'
              }`,
        );
      }

      await loadTasks();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Task action failed',
      );
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!authState) {
      return;
    }

    try {
      setFormError(null);
      setFormFeedback(null);
      await deleteTask(authState.token, taskId);
      setFormFeedback('Task deleted');
      await loadTasks();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Could not delete task',
      );
    }
  };

  const handleToggleFinished = async (task: Task) => {
    if (!authState) {
      return;
    }

    try {
      setFormError(null);
      setFormFeedback(null);
      await updateTask(authState.token, task.id, {
        isFinished: !task.isFinished,
      });
      setFormFeedback(task.isFinished ? 'Task reopened' : 'Task finished');
      await loadTasks();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Could not update task',
      );
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);

    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  };

  return (
    <div className="dashboard-grid">
      {listError || formError || formFeedback ? (
        <AlertViewport>
          {listError ? (
            <AlertBanner message={listError} variant="error" />
          ) : null}
          {formError ? (
            <AlertBanner message={formError} variant="error" />
          ) : null}
          {formFeedback ? (
            <AlertBanner message={formFeedback} variant="success" />
          ) : null}
        </AlertViewport>
      ) : null}

      <section className="hero-strip">
        <div>
          <div className="eyebrow">Overview</div>
          <h1>Tasks</h1>
        </div>
        <div className="stats-row">
          <div className="stat-card">
            <strong>{tasks.length}</strong>
            <span>Total</span>
          </div>
          <div className="stat-card">
            <strong>{tasks.filter((task) => !task.isFinished).length}</strong>
            <span>Open</span>
          </div>
          <div className="stat-card">
            <strong>{tasks.filter((task) => task.isFinished).length}</strong>
            <span>Finished</span>
          </div>
        </div>
      </section>

      <div ref={formRef}>
        <TaskForm
          editingTask={editingTask}
          onCancelEdit={() => setEditingTask(null)}
          onSubmit={handleCreateOrUpdate}
          error={formError}
          feedback={formFeedback}
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Filters</h2>
            <p className="muted">Find tasks quickly and switch between views</p>
          </div>
        </div>

        <div className="filters-row">
          <input
            placeholder="Search by task title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="segmented">
            {statusOptions.map((option) => (
              <button
                className={status === option.value ? 'active' : ''}
                key={option.value}
                onClick={() => setStatus(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <TaskList
          tasks={tasks}
          onDelete={handleDelete}
          onEdit={handleEditTask}
          onToggleFinished={handleToggleFinished}
          showOwner={authState?.user.role === 'ADMIN'}
        />
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Scheduled activities</h2>
            <p className="muted">
              Upcoming tasks that are still waiting for their scheduled time
            </p>
          </div>
        </div>

        <TaskList
          tasks={scheduledTasks}
          onDelete={handleDelete}
          onEdit={handleEditTask}
          onToggleFinished={handleToggleFinished}
          showOwner={authState?.user.role === 'ADMIN'}
        />
      </section>
    </div>
  );
};
