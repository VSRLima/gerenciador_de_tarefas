import { apiRequest } from './client';
import { CreateTaskPayload, Task } from '../types/task';

export interface TaskFilters {
  search?: string;
  status?: 'all' | 'finished' | 'pending' | 'scheduled';
}

export interface TaskCreationResult {
  mode: 'created' | 'queued';
  createdCount: number;
  batchId?: string;
}

export const listTasks = (
  token: string,
  filters: TaskFilters,
): Promise<Task[]> => {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set('search', filters.search);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }

  const query = params.toString();
  return apiRequest<Task[]>(`/tasks${query ? `?${query}` : ''}`, { token });
};

export const createTasks = (
  token: string,
  payload: CreateTaskPayload | { tasks: CreateTaskPayload[] },
): Promise<TaskCreationResult> =>
  apiRequest<TaskCreationResult>('/tasks', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });

export const updateTask = (
  token: string,
  taskId: string,
  payload: Partial<CreateTaskPayload>,
): Promise<Task> =>
  apiRequest<Task>(`/tasks/${taskId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });

export const deleteTask = (
  token: string,
  taskId: string,
): Promise<{ id: string }> =>
  apiRequest<{ id: string }>(`/tasks/${taskId}`, {
    method: 'DELETE',
    token,
  });
