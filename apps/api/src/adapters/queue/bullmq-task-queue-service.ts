import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { randomUUID } from 'crypto';
import {
  BulkTaskCreationPayload,
  QueueServicePort,
} from '../../core/ports/queue-service-port';
import { QueueNames } from './queue-names';

export class BullMqTaskQueueService implements QueueServicePort {
  constructor(private readonly connection: IORedis) {}

  public async ensureRecurringTaskSync(): Promise<void> {
    const queue = new Queue(QueueNames.TASK_MAINTENANCE, {
      connection: this.connection,
    });

    await queue.upsertJobScheduler(
      'sync-due-tasks',
      {
        every: 60_000,
      },
      {
        name: 'sync-due-tasks',
        data: {},
      },
    );
  }

  public async enqueueBulkTaskCreation(
    payload: BulkTaskCreationPayload,
  ): Promise<{ batchId: string }> {
    const queue = new Queue(QueueNames.BULK_TASK_CREATION, {
      connection: this.connection,
    });

    const batchId = randomUUID();

    await queue.add('bulk-create-tasks', payload, {
      jobId: batchId,
      removeOnComplete: 100,
      removeOnFail: 100,
    });

    return { batchId };
  }
}
