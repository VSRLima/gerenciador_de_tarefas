import { Task } from '../entities/task';

export interface CreateTaskRepositoryInput {
  title: string;
  description?: string;
  date: string;
  hour: string;
  scheduledFor: Date;
  isFinished: boolean;
  ownerId: string;
}

export interface TaskFilters {
  ownerId?: string;
  search?: string;
  status?: 'all' | 'finished' | 'pending' | 'scheduled';
  now: Date;
}

export interface UpdateTaskRepositoryInput {
  title?: string;
  description?: string;
  date?: string;
  hour?: string;
  scheduledFor?: Date;
  isFinished?: boolean;
}

export interface TaskRepositoryPort {
  create(input: CreateTaskRepositoryInput): Promise<Task>;
  createMany(inputs: CreateTaskRepositoryInput[]): Promise<number>;
  findById(id: string): Promise<Task | null>;
  list(filters: TaskFilters): Promise<Task[]>;
  update(id: string, input: UpdateTaskRepositoryInput): Promise<Task>;
  delete(id: string): Promise<void>;
  findDueUnfinished(now: Date): Promise<Task[]>;
  markAsFinished(ids: string[]): Promise<number>;
}
