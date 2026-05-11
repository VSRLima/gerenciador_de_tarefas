import { Application } from 'express';
import request from 'supertest';
import { Role } from '../../src/core/enums/role';
import { AuthorizationError } from '../../src/core/errors/authorization-error';
import { ConflictError } from '../../src/core/errors/conflict-error';
import { createHttpTestApp } from '../helpers/test-app';

const adminUser = {
  id: 'admin-1',
  username: 'adminUser',
  role: Role.ADMIN,
};

const buildManagedUser = (
  overrides: Partial<{
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    displayName?: string;
    role: Role;
    createdAt: Date;
  }> = {},
) => ({
  id: 'user-1',
  username: 'basicUser',
  email: 'basic@example.com',
  passwordHash: 'super-secret-hash',
  displayName: 'Basic User',
  role: Role.BASIC,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  ...overrides,
});

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

const authorizedRequest = (
  app: Application,
  method: HttpMethod,
  path: string,
  token = 'admin-token',
) => request(app)[method](path).set('Authorization', `Bearer ${token}`);

describe('User HTTP flow', () => {
  it.each([
    {
      name: 'list users',
      method: 'get' as const,
      path: '/api/users',
      serviceMethod: 'list' as const,
    },
    {
      name: 'create a user',
      method: 'post' as const,
      path: '/api/users',
      serviceMethod: 'create' as const,
      body: {
        username: 'newUser',
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
        role: Role.BASIC,
      },
    },
    {
      name: 'update a user',
      method: 'patch' as const,
      path: '/api/users/user-1',
      serviceMethod: 'update' as const,
      body: {
        email: 'updated@example.com',
      },
    },
    {
      name: 'delete a user',
      method: 'delete' as const,
      path: '/api/users/user-1',
      serviceMethod: 'delete' as const,
    },
  ])(
    'should block $name when the authorization header is missing',
    async ({ method, path, serviceMethod, body }) => {
      const { app, userService } = createHttpTestApp();

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
      expect(userService[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      name: 'list users',
      method: 'get' as const,
      path: '/api/users',
      serviceMethod: 'list' as const,
    },
    {
      name: 'create a user',
      method: 'post' as const,
      path: '/api/users',
      serviceMethod: 'create' as const,
      body: {
        username: 'newUser',
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
        role: Role.BASIC,
      },
    },
    {
      name: 'update a user',
      method: 'patch' as const,
      path: '/api/users/user-1',
      serviceMethod: 'update' as const,
      body: {
        email: 'updated@example.com',
      },
    },
    {
      name: 'delete a user',
      method: 'delete' as const,
      path: '/api/users/user-1',
      serviceMethod: 'delete' as const,
    },
  ])(
    'should block $name when the bearer token is invalid',
    async ({ method, path, serviceMethod, body }) => {
      const { app, userService, tokenService } = createHttpTestApp({
        tokenPayloads: {
          'admin-token': adminUser,
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
      expect(userService[serviceMethod]).not.toHaveBeenCalled();
    },
  );

  it('should sanitize managed users in the HTTP response', async () => {
    const { app, userService } = createHttpTestApp({
      userService: {
        list: jest.fn().mockResolvedValue([buildManagedUser()]),
      },
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(app, 'get', '/api/users');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: [
        {
          id: 'user-1',
          username: 'basicUser',
          email: 'basic@example.com',
          displayName: 'Basic User',
          role: Role.BASIC,
          createdAt: '2026-05-01T00:00:00.000Z',
        },
      ],
    });
    expect(response.body.data[0]).not.toHaveProperty('passwordHash');
    expect(userService.list).toHaveBeenCalledWith(adminUser);
  });

  it('should sanitize created users in the HTTP response', async () => {
    const createdUser = buildManagedUser({
      id: 'user-2',
      username: 'newUser',
      email: 'new@example.com',
      displayName: 'New User',
    });
    const { app, userService } = createHttpTestApp({
      userService: {
        create: jest.fn().mockResolvedValue(createdUser),
      },
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(app, 'post', '/api/users').send({
      username: 'newUser',
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
      role: Role.BASIC,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      success: true,
      message: 'User created successfully',
      data: {
        id: 'user-2',
        username: 'newUser',
        email: 'new@example.com',
        displayName: 'New User',
        role: Role.BASIC,
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(userService.create).toHaveBeenCalledWith(adminUser, {
      username: 'newUser',
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
      role: Role.BASIC,
    });
  });

  it.each([
    {
      name: 'the username is too short',
      body: {
        username: 'ab',
        email: 'new@example.com',
        password: 'password123',
        role: Role.BASIC,
      },
    },
    {
      name: 'the email is invalid',
      body: {
        username: 'newUser',
        email: 'invalid-email',
        password: 'password123',
        role: Role.BASIC,
      },
    },
    {
      name: 'the password is too short',
      body: {
        username: 'newUser',
        email: 'new@example.com',
        password: 'short',
        role: Role.BASIC,
      },
    },
  ])('should reject user creation when $name', async ({ body }) => {
    const { app, userService } = createHttpTestApp({
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(app, 'post', '/api/users').send(
      body,
    );

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SCHEMA_VALIDATION_ERROR');
    expect(userService.create).not.toHaveBeenCalled();
  });

  it('should map service authorization errors during user creation', async () => {
    const { app, userService } = createHttpTestApp({
      userService: {
        create: jest
          .fn()
          .mockRejectedValue(
            new AuthorizationError('Only admins can manage users'),
          ),
      },
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(app, 'post', '/api/users').send({
      username: 'newUser',
      email: 'new@example.com',
      password: 'password123',
      role: Role.BASIC,
    });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: 'Only admins can manage users',
      },
    });
    expect(userService.create).toHaveBeenCalled();
  });

  it('should sanitize updated users in the HTTP response', async () => {
    const updatedUser = buildManagedUser({
      email: 'updated@example.com',
      displayName: 'Updated User',
    });
    const { app, userService } = createHttpTestApp({
      userService: {
        update: jest.fn().mockResolvedValue(updatedUser),
      },
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'patch',
      '/api/users/user-1',
    ).send({
      email: 'updated@example.com',
      displayName: 'Updated User',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'User updated successfully',
      data: {
        id: 'user-1',
        username: 'basicUser',
        email: 'updated@example.com',
        displayName: 'Updated User',
        role: Role.BASIC,
        createdAt: '2026-05-01T00:00:00.000Z',
      },
    });
    expect(response.body.data).not.toHaveProperty('passwordHash');
    expect(userService.update).toHaveBeenCalledWith(adminUser, 'user-1', {
      email: 'updated@example.com',
      displayName: 'Updated User',
    });
  });

  it.each([
    {
      name: 'the payload is empty',
      body: {},
    },
    {
      name: 'the email is invalid',
      body: {
        email: 'invalid-email',
      },
    },
  ])('should reject user updates when $name', async ({ body }) => {
    const { app, userService } = createHttpTestApp({
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'patch',
      '/api/users/user-1',
    ).send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SCHEMA_VALIDATION_ERROR');
    expect(userService.update).not.toHaveBeenCalled();
  });

  it('should map conflict errors during user updates', async () => {
    const { app, userService } = createHttpTestApp({
      userService: {
        update: jest
          .fn()
          .mockRejectedValue(new ConflictError('Email is already in use')),
      },
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'patch',
      '/api/users/user-1',
    ).send({
      email: 'duplicate@example.com',
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'CONFLICT_ERROR',
        message: 'Email is already in use',
      },
    });
    expect(userService.update).toHaveBeenCalledWith(adminUser, 'user-1', {
      email: 'duplicate@example.com',
    });
  });

  it('should delete a user', async () => {
    const { app, userService } = createHttpTestApp({
      userService: {
        delete: jest.fn().mockResolvedValue(undefined),
      },
      tokenPayloads: {
        'admin-token': adminUser,
      },
    });

    const response = await authorizedRequest(
      app,
      'delete',
      '/api/users/user-1',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'User deleted successfully',
      data: {
        id: 'user-1',
      },
    });
    expect(userService.delete).toHaveBeenCalledWith(adminUser, 'user-1');
  });
});
