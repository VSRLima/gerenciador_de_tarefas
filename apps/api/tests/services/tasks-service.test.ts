import {
  TaskMaintenanceService,
  TaskService,
} from '../../src/application/services/task-service';
import { TaskAccessService } from '../../src/application/services/task-access-service';
import { TaskScheduleService } from '../../src/application/services/task-schedule-service';
import { Role } from '../../src/core/enums/role';

describe('TaskService', () => {
  const adminUser = {
    id: 'admin-1',
    username: 'admin',
    role: Role.ADMIN,
  };

  const basicUser = {
    id: 'basic-1',
    username: 'basic',
    role: Role.BASIC,
  };

  const buildTask = (
    overrides: Partial<{
      id: string;
      title: string;
      description?: string;
      date: string;
      hour: string;
      scheduledFor: Date;
      isFinished: boolean;
      ownerId: string;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ) => ({
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    date: '2026-05-10',
    hour: '14:30',
    scheduledFor: new Date('2026-05-10T14:30:00.000Z'),
    isFinished: false,
    ownerId: basicUser.id,
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
    ...overrides,
  });

  const createDependencies = () => {
    const taskRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findDueUnfinished: jest.fn(),
      markAsFinished: jest.fn(),
    };
    const queueService = {
      ensureRecurringTaskSync: jest.fn(),
      enqueueBulkTaskCreation: jest
        .fn()
        .mockResolvedValue({ batchId: 'batch-1' }),
    };

    const service = new TaskService(
      taskRepository as never,
      queueService as never,
      new TaskScheduleService(),
      new TaskAccessService(),
    );

    return {
      taskRepository,
      queueService,
      service,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create a task sucessfully', async () => {
    const { service, taskRepository, queueService } = createDependencies();
    taskRepository.create.mockResolvedValue(buildTask());

    const result = await service.create(basicUser, [
      { title: 'Task 1', date: '2026-05-10', hour: '14:30' },
    ]);

    expect(result).toEqual({
      mode: 'created',
      createdCount: 1,
    });
    expect(taskRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Task 1',
        date: '2026-05-10',
        hour: '14:30',
        ownerId: basicUser.id,
        isFinished: false,
        scheduledFor: expect.any(Date),
      }),
    );
    expect(queueService.enqueueBulkTaskCreation).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when there is insufficient tasks to create', async () => {
    const { service } = createDependencies();

    await expect(service.create(basicUser, [])).rejects.toThrow(
      'At least one task must be provided',
    );
  });

  it('should throw ValidationError when there is above 5000 tasks to be created', async () => {
    const { service } = createDependencies();

    await expect(
      service.create(
        basicUser,
        Array.from({ length: 5001 }, (_, index) => ({
          title: `Task ${index + 1}`,
          date: '2026-05-10',
          hour: '14:30',
        })),
      ),
    ).rejects.toThrow('Bulk creation supports up to 5000 tasks');
  });

  it('should throw ValidationError when a task do not have a date wellformed', async () => {
    const { service } = createDependencies();

    await expect(
      service.create(basicUser, [
        { title: 'Task 1', date: '2026/05/10', hour: '14:30' },
      ]),
    ).rejects.toThrow('Date must use the YYYY-MM-DD format');
  });

  it('should throw ValidationError when a task do not have a hour wellformed', async () => {
    const { service } = createDependencies();

    await expect(
      service.create(basicUser, [
        { title: 'Task 1', date: '2026-05-10', hour: '25:00' },
      ]),
    ).rejects.toThrow('Hour must use the HH:mm format');
  });

  it('should throw ValidationError when a task has a date and hour, tries to create a schedule and this schedules is not a validate date', async () => {
    const { service } = createDependencies();

    await expect(
      service.create(basicUser, [
        { title: 'Task 1', date: '2026-13-30', hour: '14:30' },
      ]),
    ).rejects.toThrow('Invalid task schedule');
  });

  it('should throw ValidationError when creating a task in the past', async () => {
    const { service } = createDependencies();

    await expect(
      service.create(basicUser, [
        { title: 'Task 1', date: '2026-04-30', hour: '14:30' },
      ]),
    ).rejects.toThrow('Task schedule cannot be in the past');
  });

  it('queues bulk task creation requests', async () => {
    const { service, taskRepository, queueService } = createDependencies();

    const result = await service.create(basicUser, [
      { title: 'Task 1', date: '2026-05-10', hour: '14:30' },
      { title: 'Task 2', date: '2026-05-11', hour: '09:00' },
    ]);

    expect(result).toEqual({
      mode: 'queued',
      createdCount: 2,
      batchId: 'batch-1',
    });
    expect(queueService.enqueueBulkTaskCreation).toHaveBeenCalledWith({
      requester: basicUser,
      tasks: [
        { title: 'Task 1', date: '2026-05-10', hour: '14:30' },
        { title: 'Task 2', date: '2026-05-11', hour: '09:00' },
      ],
    });
    expect(taskRepository.create).not.toHaveBeenCalled();
  });

  it('should return a list of all tasks for admin', async () => {
    const { service, taskRepository } = createDependencies();
    const tasks = [
      buildTask(),
      buildTask({ id: 'task-2', ownerId: 'other-user' }),
    ];
    taskRepository.list.mockResolvedValue(tasks);

    const result = await service.list(adminUser, {});

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: undefined,
        search: undefined,
        status: 'all',
        now: expect.any(Date),
      }),
    );
    expect(result).toEqual(tasks);
  });

  it('should return a list of only tasks for the current basic user', async () => {
    const { service, taskRepository } = createDependencies();
    const tasks = [buildTask({ ownerId: basicUser.id })];
    taskRepository.list.mockResolvedValue(tasks);

    const result = await service.list(basicUser, {});

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: basicUser.id,
        status: 'all',
      }),
    );
    expect(result).toEqual(tasks);
  });

  it('should filter the list by owner', async () => {
    const { service, taskRepository } = createDependencies();
    const tasks = [buildTask({ ownerId: basicUser.id })];
    taskRepository.list.mockResolvedValue(tasks);

    await service.list(basicUser, {});

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: basicUser.id,
      }),
    );
  });

  it('should filter list by search', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.list.mockResolvedValue([buildTask()]);

    await service.list(adminUser, { search: 'Task' });

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'Task',
      }),
    );
  });

  it('should filter list by status finished', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.list.mockResolvedValue([buildTask({ isFinished: true })]);

    await service.list(adminUser, { status: 'finished' });

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'finished',
      }),
    );
  });

  it('should filter list by status pending', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.list.mockResolvedValue([buildTask()]);

    await service.list(adminUser, { status: 'pending' });

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
      }),
    );
  });

  it('should filter list by status scheduled', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.list.mockResolvedValue([buildTask()]);

    await service.list(adminUser, { status: 'scheduled' });

    expect(taskRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'scheduled',
      }),
    );
  });

  it('should return an empty array in case there is not any task created', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.list.mockResolvedValue([]);

    const result = await service.list(adminUser, {});

    expect(result).toEqual([]);
  });

  it('should get a task by id sucessfully', async () => {
    const { service, taskRepository } = createDependencies();
    const task = buildTask({ ownerId: basicUser.id });
    taskRepository.findById.mockResolvedValue(task);

    const result = await service.getById(basicUser, task.id);

    expect(result).toEqual(task);
  });

  it('should get any task by id since the user is admin', async () => {
    const { service, taskRepository } = createDependencies();
    const task = buildTask({ ownerId: 'other-user' });
    taskRepository.findById.mockResolvedValue(task);

    const result = await service.getById(adminUser, task.id);

    expect(result).toEqual(task);
  });

  it('should throw NotFoundError when a task is not found', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(null);

    await expect(service.getById(basicUser, 'missing-task')).rejects.toThrow(
      'Task not found',
    );
  });

  it('should update any task as admin sucessfully', async () => {
    const { service, taskRepository } = createDependencies();
    const existingTask = buildTask({ ownerId: 'other-user' });
    const updatedTask = buildTask({
      ownerId: 'other-user',
      title: 'Updated task',
    });
    taskRepository.findById.mockResolvedValue(existingTask);
    taskRepository.update.mockResolvedValue(updatedTask);

    const result = await service.update(adminUser, existingTask.id, {
      title: 'Updated task',
    });

    expect(taskRepository.update).toHaveBeenCalledWith(existingTask.id, {
      title: 'Updated task',
      description: undefined,
      date: undefined,
      hour: undefined,
      isFinished: undefined,
      scheduledFor: undefined,
    });
    expect(result).toEqual(updatedTask);
  });

  it('should keep the original owner able to access a task after admin update', async () => {
    const { service, taskRepository } = createDependencies();
    const existingTask = buildTask({
      ownerId: basicUser.id,
      title: 'Original task',
    });
    const updatedTask = buildTask({
      ownerId: basicUser.id,
      title: 'Updated by admin',
    });
    taskRepository.findById.mockResolvedValue(existingTask);
    taskRepository.update.mockResolvedValue(updatedTask);

    await service.update(adminUser, existingTask.id, {
      title: 'Updated by admin',
    });

    taskRepository.findById.mockResolvedValue(updatedTask);
    const result = await service.getById(basicUser, existingTask.id);

    expect(result).toEqual(updatedTask);
  });

  it('should try to update a task as basic user, since it is owner of the task', async () => {
    const { service, taskRepository } = createDependencies();
    const existingTask = buildTask({ ownerId: basicUser.id });
    const updatedTask = buildTask({
      ownerId: basicUser.id,
      title: 'Updated task',
      date: '2026-05-11',
      hour: '09:00',
    });
    taskRepository.findById.mockResolvedValue(existingTask);
    taskRepository.update.mockResolvedValue(updatedTask);

    const result = await service.update(basicUser, existingTask.id, {
      title: 'Updated task',
      date: '2026-05-11',
      hour: '09:00',
    });

    expect(taskRepository.update).toHaveBeenCalledWith(
      existingTask.id,
      expect.objectContaining({
        title: 'Updated task',
        date: '2026-05-11',
        hour: '09:00',
        scheduledFor: expect.any(Date),
      }),
    );
    expect(result).toEqual(updatedTask);
  });

  it('should throw NotFoundError when a task do not exists', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(null);

    await expect(
      service.update(basicUser, 'missing-task', {
        title: 'Updated task',
      }),
    ).rejects.toThrow('Task not found');
  });

  it("should throw AuthorizationError when a user is trying to update a task which it isn't owner", async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: 'other-user' }),
    );

    await expect(
      service.update(basicUser, 'task-1', {
        title: 'Updated task',
      }),
    ).rejects.toThrow('This task does not belong to the authenticated user');
  });

  it('should throw ValidationError when a date or hour is not wellformed', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: basicUser.id }),
    );

    await expect(
      service.update(basicUser, 'task-1', {
        date: '2026/05/10',
      }),
    ).rejects.toThrow('Date must use the YYYY-MM-DD format');
  });

  it('should throw ValidationError when updating a task to a past schedule', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: basicUser.id }),
    );

    await expect(
      service.update(basicUser, 'task-1', {
        date: '2026-04-30',
        hour: '14:30',
      }),
    ).rejects.toThrow('Task schedule cannot be in the past');
  });

  it('should not allow admin to delete a task owned by another user', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: basicUser.id }),
    );

    await expect(service.delete(adminUser, 'task-1')).rejects.toThrow(
      'Admins cannot delete tasks owned by other users',
    );
    expect(taskRepository.delete).not.toHaveBeenCalled();
  });

  it('should allow admin to delete their own task', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: adminUser.id }),
    );
    taskRepository.delete.mockResolvedValue(undefined);

    await service.delete(adminUser, 'task-1');

    expect(taskRepository.delete).toHaveBeenCalledWith('task-1');
  });

  it('should allow to delete a task since the user is the owner', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: basicUser.id }),
    );
    taskRepository.delete.mockResolvedValue(undefined);

    await service.delete(basicUser, 'task-1');

    expect(taskRepository.delete).toHaveBeenCalledWith('task-1');
  });

  it('should throw AuthorizationError when an user is trying to delete a task which it is not the owner', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(
      buildTask({ ownerId: 'other-user' }),
    );

    await expect(service.delete(basicUser, 'task-1')).rejects.toThrow(
      'This task does not belong to the authenticated user',
    );
  });

  it('should throw NotFoundError when a task is not found during deletion', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findById.mockResolvedValue(null);

    await expect(service.delete(basicUser, 'missing-task')).rejects.toThrow(
      'Task not found',
    );
  });
});

describe('TaskMaintenanceService', () => {
  const createDependencies = () => {
    const taskRepository = {
      create: jest.fn(),
      createMany: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findDueUnfinished: jest.fn(),
      markAsFinished: jest.fn(),
    };

    const service = new TaskMaintenanceService(
      taskRepository as never,
      new TaskScheduleService(),
    );

    return {
      taskRepository,
      service,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('processes bulk task creation with mapped repository payload', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.createMany.mockResolvedValue(2);

    const result = await service.processBulkCreation('user-1', [
      {
        title: 'Task 1',
        description: 'Description 1',
        date: '2026-05-10',
        hour: '14:30',
      },
      {
        title: 'Task 2',
        date: '2026-05-11',
        hour: '09:00',
        isFinished: true,
      },
    ]);

    expect(taskRepository.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        title: 'Task 1',
        ownerId: 'user-1',
        isFinished: false,
        scheduledFor: expect.any(Date),
      }),
      expect.objectContaining({
        title: 'Task 2',
        ownerId: 'user-1',
        isFinished: true,
        scheduledFor: expect.any(Date),
      }),
    ]);
    expect(result).toBe(2);
  });

  it('returns zero when there are no due tasks to sync', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findDueUnfinished.mockResolvedValue([]);

    const result = await service.syncDueTasks(
      new Date('2026-05-10T14:30:00.000Z'),
    );

    expect(taskRepository.markAsFinished).not.toHaveBeenCalled();
    expect(result).toBe(0);
  });

  it('marks due tasks as finished during sync', async () => {
    const { service, taskRepository } = createDependencies();
    taskRepository.findDueUnfinished.mockResolvedValue([
      {
        id: 'task-1',
      },
      {
        id: 'task-2',
      },
    ]);
    taskRepository.markAsFinished.mockResolvedValue(2);

    const result = await service.syncDueTasks(
      new Date('2026-05-10T14:30:00.000Z'),
    );

    expect(taskRepository.markAsFinished).toHaveBeenCalledWith([
      'task-1',
      'task-2',
    ]);
    expect(result).toBe(2);
  });
});
