import { Request } from 'express';
import { TaskController } from '../../src/adapters/http/controllers/task-controller';
import { TaskService } from '../../src/application/services/task-service';
import { Role } from '../../src/core/enums/role';
import { AuthorizationError } from '../../src/core/errors/authorization-error';
import { NotFoundError } from '../../src/core/errors/not-found-error';
import { ValidationError } from '../../src/core/errors/validation-error';
import { globalErrorHandler } from '../../src/shared/errors/error-handler';
import { createMockResponse } from '../helpers/http';

type TaskControllerService = Pick<
  TaskService,
  'create' | 'list' | 'getById' | 'update' | 'delete'
>;

type TaskServiceMock = jest.Mocked<TaskControllerService>;

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

const createRequest = (input: Partial<Request>): Request =>
  input as unknown as Request;

const createTaskServiceMock = (
  overrides: Partial<TaskServiceMock> = {},
): TaskServiceMock =>
  ({
    create: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  }) as TaskServiceMock;

const createDependencies = (overrides: Partial<TaskServiceMock> = {}) => {
  const taskServiceMock = createTaskServiceMock(overrides);
  const controller = new TaskController(
    taskServiceMock as unknown as TaskService,
  );

  return {
    taskServiceMock,
    controller,
  };
};

const handleControllerError = async (
  req: Request,
  execute: (res: ReturnType<typeof createMockResponse>) => Promise<void>,
) => {
  const res = createMockResponse();

  try {
    await execute(res);
  } catch (error) {
    globalErrorHandler(error, req, res, jest.fn());
  }

  return res;
};

describe('TaskController', () => {
  let taskServiceMock: TaskServiceMock;
  let controller: TaskController;

  beforeEach(() => {
    ({ taskServiceMock, controller } = createDependencies());
  });

  it('should create a task sucessfully', async () => {
    taskServiceMock.create.mockResolvedValue({
      mode: 'created',
      createdCount: 1,
    });

    const req = createRequest({
      user: basicUser,
      body: {
        title: 'Task 1',
        description: 'Description 1',
        date: '2026-05-10',
        hour: '14:30',
      },
    });
    const res = createMockResponse();

    await controller.create(req, res);

    expect(taskServiceMock.create).toHaveBeenCalledWith(basicUser, [req.body]);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should create a queued task sucessfully', async () => {
    taskServiceMock.create.mockResolvedValue({
      mode: 'queued',
      createdCount: 2,
      batchId: 'batch-1',
    });

    const req = createRequest({
      user: basicUser,
      body: {
        tasks: [
          {
            title: 'Task 1',
            date: '2026-05-10',
            hour: '14:30',
          },
          {
            title: 'Task 2',
            date: '2026-05-11',
            hour: '09:00',
          },
        ],
      },
    });
    const res = createMockResponse();

    await controller.create(req, res);

    expect(taskServiceMock.create).toHaveBeenCalledWith(
      basicUser,
      req.body.tasks,
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it('should throw schema error when a request is malformed when creating a task', async () => {
    const req = createRequest({
      user: basicUser,
      body: {
        title: '',
        date: '2026-05-10',
        hour: '14:30',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(taskServiceMock.create).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when a user is not authenticated', async () => {
    const req = createRequest({
      body: {
        title: 'Task 1',
        date: '2026-05-10',
        hour: '14:30',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(taskServiceMock.create).not.toHaveBeenCalled();
  });

  it('should throw schema error when there are no tasks to create', async () => {
    const req = createRequest({
      user: basicUser,
      body: {
        tasks: [],
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(taskServiceMock.create).not.toHaveBeenCalled();
  });

  it('should throw schema error when the bulk size exceeds 5000 tasks', async () => {
    const req = createRequest({
      user: basicUser,
      body: {
        tasks: Array.from({ length: 5001 }, (_, index) => ({
          title: `Task ${index + 1}`,
          date: '2026-05-10',
          hour: '14:30',
        })),
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(taskServiceMock.create).not.toHaveBeenCalled();
  });

  it('should return 400 when trying to create a task in the past', async () => {
    taskServiceMock.create.mockRejectedValue(
      new ValidationError('Task schedule cannot be in the past'),
    );

    const req = createRequest({
      user: basicUser,
      body: {
        title: 'Task 1',
        date: '2026-05-10',
        hour: '14:30',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(taskServiceMock.create).toHaveBeenCalledWith(basicUser, [req.body]);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should list all tasks sucessfully', async () => {
    taskServiceMock.list.mockResolvedValue([
      buildTask(),
      buildTask({ id: 'task-2', title: 'Task 2' }),
    ]);

    const req = createRequest({
      user: adminUser,
      query: {},
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(taskServiceMock.list).toHaveBeenCalledWith(adminUser, {
      search: undefined,
      status: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should filter the list by owner', async () => {
    taskServiceMock.list.mockResolvedValue([
      buildTask({ ownerId: basicUser.id }),
    ]);

    const req = createRequest({
      user: basicUser,
      query: {},
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(taskServiceMock.list).toHaveBeenCalledWith(basicUser, {
      search: undefined,
      status: undefined,
    });
  });

  it('should filter list by search', async () => {
    taskServiceMock.list.mockResolvedValue([buildTask()]);

    const req = createRequest({
      user: adminUser,
      query: {
        search: 'Task',
      },
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(taskServiceMock.list).toHaveBeenCalledWith(adminUser, {
      search: 'Task',
      status: undefined,
    });
  });

  it('should filter list by status finished', async () => {
    taskServiceMock.list.mockResolvedValue([buildTask({ isFinished: true })]);

    const req = createRequest({
      user: adminUser,
      query: {
        status: 'finished',
      },
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(taskServiceMock.list).toHaveBeenCalledWith(adminUser, {
      search: undefined,
      status: 'finished',
    });
  });

  it('should filter list by status pending', async () => {
    taskServiceMock.list.mockResolvedValue([buildTask()]);

    const req = createRequest({
      user: adminUser,
      query: {
        status: 'pending',
      },
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(taskServiceMock.list).toHaveBeenCalledWith(adminUser, {
      search: undefined,
      status: 'pending',
    });
  });

  it('should filter list by status scheduled', async () => {
    taskServiceMock.list.mockResolvedValue([buildTask()]);

    const req = createRequest({
      user: adminUser,
      query: {
        status: 'scheduled',
      },
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(taskServiceMock.list).toHaveBeenCalledWith(adminUser, {
      search: undefined,
      status: 'scheduled',
    });
  });

  it('should get a task by id sucessfully', async () => {
    taskServiceMock.getById.mockResolvedValue(buildTask());

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
    });
    const res = createMockResponse();

    await controller.getById(req, res);

    expect(taskServiceMock.getById).toHaveBeenCalledWith(basicUser, 'task-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should allow admin access any task by id', async () => {
    taskServiceMock.getById.mockResolvedValue(
      buildTask({ ownerId: 'other-user' }),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'task-1' },
    });
    const res = createMockResponse();

    await controller.getById(req, res);

    expect(taskServiceMock.getById).toHaveBeenCalledWith(adminUser, 'task-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw NotFoundError when a task is not found', async () => {
    taskServiceMock.getById.mockRejectedValue(
      new NotFoundError('Task not found'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'missing-task' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.getById(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should throw AuthorizationError when an basic user is not owner of the task', async () => {
    taskServiceMock.getById.mockRejectedValue(
      new AuthorizationError(
        'This task does not belong to the authenticated user',
      ),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-2' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.getById(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should update a task sucessfully', async () => {
    taskServiceMock.update.mockResolvedValue(
      buildTask({ title: 'Updated task' }),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
      body: {
        title: 'Updated task',
      },
    });
    const res = createMockResponse();

    await controller.update(req, res);

    expect(taskServiceMock.update).toHaveBeenCalledWith(
      basicUser,
      'task-1',
      req.body,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should allow an admin update any task', async () => {
    taskServiceMock.update.mockResolvedValue(
      buildTask({ title: 'Updated task' }),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'task-1' },
      body: {
        title: 'Updated task',
      },
    });
    const res = createMockResponse();

    await controller.update(req, res);

    expect(taskServiceMock.update).toHaveBeenCalledWith(
      adminUser,
      'task-1',
      req.body,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should allow the owner to fetch a task after an admin update happened', async () => {
    taskServiceMock.getById.mockResolvedValue(
      buildTask({
        ownerId: basicUser.id,
        title: 'Updated by admin',
      }),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
    });
    const res = createMockResponse();

    await controller.getById(req, res);

    expect(taskServiceMock.getById).toHaveBeenCalledWith(basicUser, 'task-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw AuthorizationError when a user is not owner of the task which it is trying to update', async () => {
    taskServiceMock.update.mockRejectedValue(
      new AuthorizationError(
        'This task does not belong to the authenticated user',
      ),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-2' },
      body: {
        title: 'Updated task',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should throw schema error when a request is malformed when updating a task', async () => {
    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
      body: {
        hour: '99:99',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(taskServiceMock.update).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when a task is not found when trying to update', async () => {
    taskServiceMock.update.mockRejectedValue(
      new NotFoundError('Task not found'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'missing-task' },
      body: {
        title: 'Updated task',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should throw ValidationError if the data and hour is not in the correct format', async () => {
    taskServiceMock.update.mockRejectedValue(
      new ValidationError('Invalid task schedule'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
      body: {
        date: '2026-02-30',
        hour: '14:30',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 when trying to update a task with a past schedule', async () => {
    taskServiceMock.update.mockRejectedValue(
      new ValidationError('Task schedule cannot be in the past'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
      body: {
        date: '2026-05-10',
        hour: '14:30',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(taskServiceMock.update).toHaveBeenCalledWith(
      basicUser,
      'task-1',
      req.body,
    );
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should delete a task sucessfully', async () => {
    taskServiceMock.delete.mockResolvedValue(undefined);

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-1' },
    });
    const res = createMockResponse();

    await controller.delete(req, res);

    expect(taskServiceMock.delete).toHaveBeenCalledWith(basicUser, 'task-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should return 403 when an admin tries to delete a task owned by another user', async () => {
    taskServiceMock.delete.mockRejectedValue(
      new AuthorizationError('Admins cannot delete tasks owned by other users'),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'task-1' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should throw ValidationError when a user is not authenticated when trying to delete a task', async () => {
    const req = createRequest({
      params: { id: 'task-1' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(taskServiceMock.delete).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when a task is not found', async () => {
    taskServiceMock.delete.mockRejectedValue(
      new NotFoundError('Task not found'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'missing-task' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should allow a admin delete any task', async () => {
    taskServiceMock.delete.mockResolvedValue(undefined);

    const req = createRequest({
      user: adminUser,
      params: { id: 'task-1' },
    });
    const res = createMockResponse();

    await controller.delete(req, res);

    expect(taskServiceMock.delete).toHaveBeenCalledWith(adminUser, 'task-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw AuthorizationError when a user is not owner of the task when it is trying to delete', async () => {
    taskServiceMock.delete.mockRejectedValue(
      new AuthorizationError(
        'This task does not belong to the authenticated user',
      ),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'task-2' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
