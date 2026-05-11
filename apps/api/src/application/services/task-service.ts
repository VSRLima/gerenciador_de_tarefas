import { CreateTaskInput, UpdateTaskInput } from '../dto/task-dto';
import { TaskAccessService } from './task-access-service';
import { TaskScheduleService } from './task-schedule-service';
import { Task } from '../../core/entities/task';
import { AuthenticatedUser } from '../../core/entities/user';
import { Role } from '../../core/enums/role';
import { AuthorizationError } from '../../core/errors/authorization-error';
import { NotFoundError } from '../../core/errors/not-found-error';
import { ValidationError } from '../../core/errors/validation-error';
import { QueueServicePort } from '../../core/ports/queue-service-port';
import { TaskRepositoryPort } from '../../core/ports/task-repository-port';

export interface ListTasksFilters {
  search?: string;
  status?: 'all' | 'finished' | 'pending' | 'scheduled';
}

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepositoryPort,
    private readonly queueService: QueueServicePort,
    private readonly taskScheduleService: TaskScheduleService,
    private readonly taskAccessService: TaskAccessService,
  ) {}

  public async create(
    actor: AuthenticatedUser,
    tasks: CreateTaskInput[],
  ): Promise<{
    mode: 'created' | 'queued';
    createdCount: number;
    batchId?: string;
  }> {
    if (!tasks.length) {
      throw new ValidationError('At least one task must be provided');
    }

    if (tasks.length > 5000) {
      throw new ValidationError('Bulk creation supports up to 5000 tasks');
    }

    tasks.forEach((task) =>
      this.taskScheduleService.validate(task.date, task.hour),
    );

    if (tasks.length === 1) {
      const task = tasks[0];
      await this.taskRepository.create({
        title: task.title,
        description: task.description,
        date: task.date,
        hour: task.hour,
        isFinished: task.isFinished ?? false,
        ownerId: actor.id,
        scheduledFor: this.taskScheduleService.toDate(task.date, task.hour),
      });

      return {
        mode: 'created',
        createdCount: 1,
      };
    }

    const queued = await this.queueService.enqueueBulkTaskCreation({
      requester: actor,
      tasks,
    });

    return {
      mode: 'queued',
      createdCount: tasks.length,
      batchId: queued.batchId,
    };
  }

  public async list(
    actor: AuthenticatedUser,
    filters: ListTasksFilters,
  ): Promise<Task[]> {
    return this.taskRepository.list({
      now: new Date(),
      ownerId: actor.role === Role.ADMIN ? undefined : actor.id,
      search: filters.search,
      status: filters.status ?? 'all',
    });
  }

  public async getById(
    actor: AuthenticatedUser,
    taskId: string,
  ): Promise<Task> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    this.taskAccessService.ensureCanAccess(actor, task);
    return task;
  }

  public async update(
    actor: AuthenticatedUser,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const existingTask = await this.taskRepository.findById(taskId);
    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    this.taskAccessService.ensureCanAccess(actor, existingTask);

    const nextDate = input.date ?? existingTask.date;
    const nextHour = input.hour ?? existingTask.hour;

    if (input.date || input.hour) {
      this.taskScheduleService.validate(nextDate, nextHour);
    }

    return this.taskRepository.update(taskId, {
      title: input.title,
      description: input.description,
      date: input.date,
      hour: input.hour,
      isFinished: input.isFinished,
      scheduledFor:
        input.date || input.hour
          ? this.taskScheduleService.toDate(nextDate, nextHour)
          : undefined,
    });
  }

  public async delete(actor: AuthenticatedUser, taskId: string): Promise<void> {
    const existingTask = await this.taskRepository.findById(taskId);
    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    this.taskAccessService.ensureCanAccess(actor, existingTask);

    if (actor.role === Role.ADMIN && existingTask.ownerId !== actor.id) {
      throw new AuthorizationError(
        'Admins cannot delete tasks owned by other users',
      );
    }

    await this.taskRepository.delete(taskId);
  }
}

export class TaskMaintenanceService {
  constructor(
    private readonly taskRepository: TaskRepositoryPort,
    private readonly taskScheduleService: TaskScheduleService,
  ) {}

  public async processBulkCreation(
    ownerId: string,
    tasks: CreateTaskInput[],
  ): Promise<number> {
    tasks.forEach((task) =>
      this.taskScheduleService.validate(task.date, task.hour),
    );

    const payload = tasks.map((task) => ({
      title: task.title,
      description: task.description,
      date: task.date,
      hour: task.hour,
      isFinished: task.isFinished ?? false,
      ownerId,
      scheduledFor: this.taskScheduleService.toDate(task.date, task.hour),
    }));

    return this.taskRepository.createMany(payload);
  }

  public async syncDueTasks(now = new Date()): Promise<number> {
    const dueTasks = await this.taskRepository.findDueUnfinished(now);
    if (!dueTasks.length) {
      return 0;
    }

    return this.taskRepository.markAsFinished(dueTasks.map((task) => task.id));
  }
}
