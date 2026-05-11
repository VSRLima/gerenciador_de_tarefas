import { Request } from 'express';
import { AuthController } from '../../src/adapters/http/controllers/auth-controller';
import { AuthenticationError } from '../../src/core/errors/authentication-error';
import { globalErrorHandler } from '../../src/shared/errors/error-handler';
import { createMockResponse } from '../helpers/http';

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

describe('AuthController', () => {
  it('should throw error when loginSchema is not correct', async () => {
    const authService = {
      login: jest.fn(),
      logout: jest.fn(),
    };

    const controller = new AuthController(authService as never);
    const req = {
      body: {
        login: '',
        password: 'short',
      },
    } as Request;
    const res = await handleControllerError(req, (res) =>
      controller.login(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should throw AuthenticationError when the credentials is not correct', async () => {
    const authService = {
      login: jest
        .fn()
        .mockRejectedValue(new AuthenticationError('Invalid credentials')),
      logout: jest.fn(),
    };

    const controller = new AuthController(authService as never);
    const req = {
      body: {
        login: 'basicUser',
        password: 'wrongpass',
      },
    } as Request;
    const res = await handleControllerError(req, (res) =>
      controller.login(req, res),
    );

    expect(authService.login).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should sucessfully login', async () => {
    const authService = {
      login: jest.fn().mockResolvedValue({
        token: 'token-1',
        user: {
          id: 'user-1',
          username: 'basicUser',
          role: 'BASIC',
          displayName: 'Basic User',
        },
      }),
      logout: jest.fn(),
    };

    const controller = new AuthController(authService as never);
    const req = {
      body: {
        login: 'basicUser',
        password: 'password123',
      },
    } as Request;
    const res = createMockResponse();

    await controller.login(req, res);

    expect(authService.login).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw ValidationError when user tries to logout without an authToken', async () => {
    const authService = {
      login: jest.fn(),
      logout: jest.fn(),
    };

    const controller = new AuthController(authService as never);
    const req = {} as Request;
    const res = await handleControllerError(req, (res) =>
      controller.logout(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('should throw UNAUTHORIZED when the user is not authenticated', async () => {
    const authService = {
      login: jest.fn(),
      logout: jest
        .fn()
        .mockRejectedValue(new AuthenticationError('Authentication failed')),
    };

    const controller = new AuthController(authService as never);
    const req = {
      authToken: 'token-1',
    } as Request;
    const res = await handleControllerError(req, (res) =>
      controller.logout(req, res),
    );

    expect(authService.logout).toHaveBeenCalledWith('token-1');
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
