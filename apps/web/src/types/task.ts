export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  hour: string;
  scheduledFor: string;
  isFinished: boolean;
  ownerId: string;
  ownerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  date: string;
  hour: string;
  isFinished?: boolean;
}
