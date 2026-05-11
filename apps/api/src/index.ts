import IORedis from 'ioredis';
import { AdminAuthorizationService } from './application/services/admin-authorization-service';
import { TaskAccessService } from './application/services/task-access-service';
import { TaskScheduleService } from './application/services/task-schedule-service';
import { AuthService } from './application/services/auth-service';
import {
  TaskMaintenanceService,
  TaskService,
} from './application/services/task-service';
import { UserService } from './application/services/user-service';
import { PrismaTaskRepository } from './adapters/database/prisma-task-repository';
import { PrismaUserRepository } from './adapters/database/prisma-user-repository';
import { AuthController } from './adapters/http/controllers/auth-controller';
import { TaskController } from './adapters/http/controllers/task-controller';
import { UserController } from './adapters/http/controllers/user-controller';
import { BullMqTaskQueueService } from './adapters/queue/bullmq-task-queue-service';
import { registerQueueWorkers } from './adapters/queue/register-queue-workers';
import { BcryptPasswordHasher } from './adapters/security/bcrypt-password-hasher';
import { JwtTokenService } from './adapters/security/jwt-token-service';
import { createApp } from './app';
import { connectMongoose } from './database/mongoose/mongoose-client';
import { TaskModel } from './database/mongoose/models/task-model';
import { UserModel } from './database/mongoose/models/user-model';
import { prisma } from './database/prisma/prisma-client';
import { env } from './shared/config/env';

const bootstrap = async (): Promise<void> => {
  await connectMongoose(env.MONGO_URL);
  await Promise.all([UserModel.syncIndexes(), TaskModel.syncIndexes()]);

  const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const userRepository = new PrismaUserRepository();
  const taskRepository = new PrismaTaskRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService();
  const taskScheduleService = new TaskScheduleService();
  const taskAccessService = new TaskAccessService();
  const adminAuthorizationService = new AdminAuthorizationService();
  const queueService = new BullMqTaskQueueService(redisConnection);

  const authService = new AuthService(
    userRepository,
    passwordHasher,
    tokenService,
  );
  const userService = new UserService(
    userRepository,
    passwordHasher,
    adminAuthorizationService,
  );
  const taskService = new TaskService(
    taskRepository,
    queueService,
    taskScheduleService,
    taskAccessService,
  );
  const taskMaintenanceService = new TaskMaintenanceService(
    taskRepository,
    taskScheduleService,
  );

  registerQueueWorkers({
    redisConnection,
    taskMaintenanceService,
  });

  await queueService.ensureRecurringTaskSync();
  await taskMaintenanceService.syncDueTasks(new Date());

  const authController = new AuthController(authService);
  const taskController = new TaskController(taskService);
  const userController = new UserController(userService);

  const app = createApp({
    authController,
    taskController,
    userController,
    tokenService,
  });

  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
};

void bootstrap().catch(async (error) => {
  console.error('Failed to bootstrap API', error);
  await prisma.$disconnect();
  process.exit(1);
});
