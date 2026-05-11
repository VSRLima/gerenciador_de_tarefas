import { Application } from 'express';
import request from 'supertest';
import { Role } from '../../src/core/enums/role';
import { AuthorizationError } from '../../src/core/errors/authorization-error';
import { NotFoundError } from '../../src/core/errors/not-found-error';
import { createHttpTestApp } from '../helpers/test-app';

const basicUser = {
  id: 'basic-1',
  username: 'basicUser',
  role: Role.BASIC,
};

const adminUser = {
  id: 'admin-1',
  username: 'adminUser',
  role: Role.ADMIN,
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
  title: 'Write report',
  description: 'Monthly report',
  date: '2026-05-12',
  hour: '10:00',
  scheduledFor: new Date('2026-05-12T10:00:00.000Z'),
  isFinished: false,
  ownerId: basicUser.id,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  ...overrides,
});

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

const authorizedRequest = (
  app: Application,
  method: HttpMethod,
  path: string,
  token = 'valid-token',
) => request(app)[method](path).set('Authorization', `Bearer ${token}`);

describe('Task HTTP flow', () => {
  it.each([
    {
      name: 'list tasks',
      method: 'get' as const,
      path: '/api/tasks',
      serviceMethod: 'list' as const,
    },
    {
      name: 'create a task',
      method: 'post' as const,
      path: '/api/tasks',
      serviceMethod: 'create' as const,
      body: {
        title: 'Write report',
        date: '2026-05-12',
        hour: '10:00',
      },
    },
    {
      name: 'get a task by id',
      method: 'get' as const,
      path: '/api/tasks/task-1',
      serviceMethod: 'getById' as const,
    },
    {
      name: 'update a task',
      method: 'patch' as const,
      path: '/api/tasks/task-1',
      serviceMethod: 'update' as const,
      body: {
        title: 'Updated report',
      },
    },
    {
      name: 'delete a task',
      method: 'delete' as const,
      path: '/api/tasks/task-1',
      serviceMethod: 'delete' as const,
    },
  ])(
    'should block $name when the authorization header is missing',
    async ({ method, path, serviceMethod, body }) => {
      const { app, taskService } = createHttpTestApp();

      const httpRequest = request(app)[method](path);
      if (body) {
        httpRequest.send(body);
      }

      const response = await httpRequest;

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header',
        },
      });
      expect(taskService[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      name: 'list tasks',
      method: 'get' as const,
      path: '/api/tasks',
      serviceMethod: 'list' as const,
    },
    {
      name: 'create a task',
      method: 'post' as const,
      path: '/api/tasks',
      serviceMethod: 'create' as const,
      body: {
        title: 'Write report',
        date: '2026-05-12',
        hour: '10:00',
      },
    },
    {
      name: 'get a task by id',
      method: 'get' as const,
      path: '/api/tasks/task-1',
      serviceMethod: 'getById' as const,
    },
    {
      name: 'update a task',
      method: 'patch' as const,
      path: '/api/tasks/task-1',
      serviceMethod: 'update' as const,
      body: {
        title: 'Updated report',
      },
    },
    {
      name: 'delete a task',
      method: 'delete' as const,
      path: '/api/tasks/task-1',
      serviceMethod: 'delete' as const,
    },
  ])(
    'should block $name when the bearer token is invalid',
    async ({ method, path, serviceMethod, body }) => {
      const { app, taskService, tokenService } = createHttpTestApp({
        tokenPayloads: {
          'valid-token': basicUser,
        },
      });

      const httpRequest = authorizedRequest(app, method, path, 'invalid-token');
      if (body) {
        httpRequest.send(body);
      }

      const response = await httpRequest;

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      expect(tokenService.verify).toHaveBeenCalledWith('invalid-token');
      expect(taskService[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it('should list tasks using query parsing and controller serialization', async () => {
    const task = buildTask({ isFinished: true });
    const { app, taskService, tokenService } = createHttpTestApp({
      taskService: {
        list: jest.fn().mockResolvedValue([task]),
      },
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'get',
      '/api/tasks?search=report&status=finished',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [
        {
          ...task,
          scheduledFor: '2026-05-12T10:00:00.000Z',
          createdAt: '2026-05-01T00:00:00.000Z',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    });
    expect(tokenService.verify).toHaveBeenCalledWith('valid-token');
    expect(taskService.list).toHaveBeenCalledWith(basicUser, {
      search: 'report',
      status: 'finished',
    });
  });

  it('should ignore unsupported status filters when listing tasks', async () => {
    const { app, taskService } = createHttpTestApp({
      taskService: {
        list: jest.fn().mockResolvedValue([]),
      },
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'get',
      '/api/tasks?status=archived',
    );

    expect(response.status).toBe(200);
    expect(taskService.list).toHaveBeenCalledWith(basicUser, {
      search: undefined,
      status: undefined,
    });
  });

  it.each([
    {
      name: 'single task payload',
      body: {
        title: 'Write report',
        description: 'Monthly report',
        date: '2026-05-12',
        hour: '10:00',
      },
      serviceResult: {
        mode: 'created' as const,
        createdCount: 1,
      },
      expectedStatus: 201,
      expectedTasks: [
        {
          title: 'Write report',
          description: 'Monthly report',
          date: '2026-05-12',
          hour: '10:00',
        },
      ],
    },
    {
      name: 'bulk task payload',
      body: {
        tasks: [
          {
            title: 'Write report',
            date: '2026-05-12',
            hour: '10:00',
          },
          {
            title: 'Review report',
            date: '2026-05-13',
            hour: '11:30',
          },
        ],
      },
      serviceResult: {
        mode: 'queued' as const,
        createdCount: 2,
        batchId: 'batch-1',
      },
      expectedStatus: 202,
      expectedTasks: [
        {
          title: 'Write report',
          date: '2026-05-12',
          hour: '10:00',
        },
        {
          title: 'Review report',
          date: '2026-05-13',
          hour: '11:30',
        },
      ],
    },
  ])(
    'should create tasks for a $name',
    async ({ body, serviceResult, expectedStatus, expectedTasks }) => {
      const { app, taskService } = createHttpTestApp({
        taskService: {
          create: jest.fn().mockResolvedValue(serviceResult),
        },
        tokenPayloads: {
          'valid-token': basicUser,
        },
      });

      const response = await authorizedRequest(app, 'post', '/api/tasks').send(
        body,
      );

      expect(response.status).toBe(expectedStatus);
      expect(response.body).toEqual({
        success: true,
        message: 'Tasks processed successfully',
        data: serviceResult,
      });
      expect(taskService.create).toHaveBeenCalledWith(basicUser, expectedTasks);
    },
  );

  it.each([
    {
      name: 'single task title is empty',
      body: {
        title: '',
        date: '2026-05-12',
        hour: '10:00',
      },
    },
    {
      name: 'bulk payload has no tasks',
      body: {
        tasks: [],
      },
    },
    {
      name: 'a bulk task item is malformed',
      body: {
        tasks: [
          {
            title: 'Write report',
            date: '2026-05-12',
            hour: '10:00',
          },
          {
            title: 'Review report',
            date: '2026-05-13',
            hour: '25:00',
          },
        ],
      },
    },
  ])('should reject task creation when $name', async ({ body }) => {
    const { app, taskService } = createHttpTestApp({
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(app, 'post', '/api/tasks').send(
      body,
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SCHEMA_VALIDATION_ERROR');
    expect(taskService.create).not.toHaveBeenCalled();
  });

  it('should return a task by id', async () => {
    const task = buildTask();
    const { app, taskService } = createHttpTestApp({
      taskService: {
        getById: jest.fn().mockResolvedValue(task),
      },
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(app, 'get', '/api/tasks/task-1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        ...task,
        scheduledFor: '2026-05-12T10:00:00.000Z',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    });
    expect(taskService.getById).toHaveBeenCalledWith(basicUser, 'task-1');
  });

  it('should map not-found errors when retrieving a task', async () => {
    const { app, taskService } = createHttpTestApp({
      taskService: {
        getById: jest
          .fn()
          .mockRejectedValue(new NotFoundError('Task not found')),
      },
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'get',
      '/api/tasks/missing-task',
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND_ERROR',
        message: 'Task not found',
      },
    });
    expect(taskService.getById).toHaveBeenCalledWith(basicUser, 'missing-task');
  });

  it('should update a task', async () => {
    const updatedTask = buildTask({
      title: 'Updated report',
      isFinished: true,
    });
    const { app, taskService } = createHttpTestApp({
      taskService: {
        update: jest.fn().mockResolvedValue(updatedTask),
      },
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'patch',
      '/api/tasks/task-1',
    ).send({
      title: 'Updated report',
      isFinished: true,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Task updated successfully',
      data: {
        ...updatedTask,
        scheduledFor: '2026-05-12T10:00:00.000Z',
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-01T00:00:00.000Z',
      },
    });
    expect(taskService.update).toHaveBeenCalledWith(basicUser, 'task-1', {
      title: 'Updated report',
      isFinished: true,
    });
  });

  it('should reject malformed task updates before calling the service', async () => {
    const { app, taskService } = createHttpTestApp({
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'patch',
      '/api/tasks/task-1',
    ).send({
      hour: '25:00',
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SCHEMA_VALIDATION_ERROR');
    expect(taskService.update).not.toHaveBeenCalled();
  });

  it('should delete a task', async () => {
    const { app, taskService } = createHttpTestApp({
      taskService: {
        delete: jest.fn().mockResolvedValue(undefined),
      },
      tokenPayloads: {
        'valid-token': basicUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'delete',
      '/api/tasks/task-1',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Task deleted successfully',
      data: {
        id: 'task-1',
      },
    });
    expect(taskService.delete).toHaveBeenCalledWith(basicUser, 'task-1');
  });

  it('should map service authorization errors through the global error handler', async () => {
    const { app, taskService } = createHttpTestApp({
      taskService: {
        delete: jest
          .fn()
          .mockRejectedValue(
            new AuthorizationError(
              'Admins cannot delete tasks owned by other users',
            ),
          ),
      },
      tokenPayloads: {
        'valid-token': adminUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'delete',
      '/api/tasks/task-1',
    );

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Admins cannot delete tasks owned by other users',
      },
    });
    expect(taskService.delete).toHaveBeenCalledWith(adminUser, 'task-1');
  });
});
