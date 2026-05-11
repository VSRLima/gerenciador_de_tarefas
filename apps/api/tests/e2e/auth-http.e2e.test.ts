import request from 'supertest';
import { Role } from '../../src/core/enums/role';
import { AuthenticationError } from '../../src/core/errors/authentication-error';
import { createHttpTestApp } from '../helpers/test-app';

describe('Auth HTTP flow', () => {
  it.each([
    {
      name: 'login is empty',
      body: {
        login: '',
        password: 'password123',
      },
    },
    {
      name: 'password is too short',
      body: {
        login: 'basicUser',
        password: 'short',
      },
    },
    {
      name: 'payload is missing required fields',
      body: {},
    },
  ])('should reject login when $name', async ({ body }) => {
    const { app, authService } = createHttpTestApp();

    const response = await request(app).post('/api/auth/login').send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SCHEMA_VALIDATION_ERROR');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should map authentication failures during login', async () => {
    const { app, authService } = createHttpTestApp({
      authService: {
        login: jest
          .fn()
          .mockRejectedValue(new AuthenticationError('Invalid credentials')),
      },
    });

    const response = await request(app).post('/api/auth/login').send({
      login: 'basicUser',
      password: 'password123',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid credentials',
      },
    });
    expect(authService.login).toHaveBeenCalledWith({
      login: 'basicUser',
      password: 'password123',
    });
  });

  it('should login successfully through the Express pipeline', async () => {
    const { app, authService } = createHttpTestApp({
      authService: {
        login: jest.fn().mockResolvedValue({
          token: 'token-1',
          user: {
            id: 'user-1',
            username: 'basicUser',
            role: Role.BASIC,
            displayName: 'Basic User',
          },
        }),
      },
    });

    const response = await request(app).post('/api/auth/login').send({
      login: 'basicUser',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Login successful',
      data: {
        token: 'token-1',
        user: {
          id: 'user-1',
          username: 'basicUser',
          role: Role.BASIC,
          displayName: 'Basic User',
        },
      },
    });
    expect(authService.login).toHaveBeenCalledWith({
      login: 'basicUser',
      password: 'password123',
    });
  });

  it.each([
    {
      name: 'authorization header is missing',
      header: undefined,
      expectedMessage: 'Missing or invalid Authorization header',
    },
    {
      name: 'authorization header is malformed',
      header: 'Token valid-token',
      expectedMessage: 'Missing or invalid Authorization header',
    },
    {
      name: 'bearer token is invalid',
      header: 'Bearer invalid-token',
      expectedMessage: 'Invalid or expired token',
    },
  ])('should reject logout when $name', async ({ header, expectedMessage }) => {
    const { app, authService } = createHttpTestApp({
      tokenPayloads: {
        'valid-token': {
          id: 'user-1',
          username: 'basicUser',
          role: Role.BASIC,
        },
      },
    });

    const httpRequest = request(app).post('/api/auth/logout');
    if (header) {
      httpRequest.set('Authorization', header);
    }

    const response = await httpRequest.send();

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: expectedMessage,
      },
    });
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should logout successfully when the bearer token is valid', async () => {
    const { app, authService, tokenService } = createHttpTestApp({
      authService: {
        logout: jest.fn().mockResolvedValue(undefined),
      },
      tokenPayloads: {
        'valid-token': {
          id: 'user-1',
          username: 'basicUser',
          role: Role.BASIC,
        },
      },
    });

    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer valid-token')
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Logout successful',
      data: null,
    });
    expect(tokenService.verify).toHaveBeenCalledWith('valid-token');
    expect(authService.logout).toHaveBeenCalledWith('valid-token');
  });
});
