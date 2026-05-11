import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import { TaskMaintenanceService } from '../../application/services/task-service';
import { QueueNames } from './queue-names';

interface QueueWorkersDependencies {
  redisConnection: IORedis;
  taskMaintenanceService: TaskMaintenanceService;
}

export const registerQueueWorkers = ({
  redisConnection,
  taskMaintenanceService,
}: QueueWorkersDependencies): Worker[] => {
  const bulkTaskWorker = new Worker(
    QueueNames.BULK_TASK_CREATION,
    async (job) => {
      await taskMaintenanceService.processBulkCreation(
        job.data.requester.id,
        job.data.tasks,
      );
    },
    {
      connection: redisConnection,
    },
  );

  const maintenanceWorker = new Worker(
    QueueNames.TASK_MAINTENANCE,
    async () => {
      await taskMaintenanceService.syncDueTasks(new Date());
    },
    {
      connection: redisConnection,
    },
  );

  return [bulkTaskWorker, maintenanceWorker];
};
