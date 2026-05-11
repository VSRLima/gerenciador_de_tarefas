export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;
  hour: string;
  scheduledFor: Date;
  isFinished: boolean;
  ownerId: string;
  ownerName?: string;
  createdAt: Date;
  updatedAt: Date;
}
