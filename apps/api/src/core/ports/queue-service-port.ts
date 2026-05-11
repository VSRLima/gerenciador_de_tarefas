import { CreateTaskInput } from '../../application/dto/task-dto';
import { AuthenticatedUser } from '../entities/user';

export interface BulkTaskCreationPayload {
  requester: AuthenticatedUser;
  tasks: CreateTaskInput[];
}

export interface QueueServicePort {
  ensureRecurringTaskSync(): Promise<void>;
  enqueueBulkTaskCreation(
    payload: BulkTaskCreationPayload,
  ): Promise<{ batchId: string }>;
}
