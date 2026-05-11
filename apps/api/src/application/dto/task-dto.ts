export interface CreateTaskInput {
  title: string;
  description?: string;
  date: string;
  hour: string;
  isFinished?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  date?: string;
  hour?: string;
  isFinished?: boolean;
}
