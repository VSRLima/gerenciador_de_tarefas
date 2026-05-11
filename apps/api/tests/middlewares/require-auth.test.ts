import { NextFunction, Request } from 'express';
import { requireAuth } from '../../src/adapters/http/middlewares/require-auth';
import { Role } from '../../src/core/enums/role';
import { createMockResponse } from '../helpers/http';

describe('requireAuth middleware', () => {
  it('returns 401 when the authorization header is missing', () => {
    const middleware = requireAuth({
      sign: jest.fn(),
      revoke: jest.fn(),
      verify: jest.fn(),
    });

    const req = { headers: {} } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('sets req.user and calls next for valid tokens', () => {
    const middleware = requireAuth({
      sign: jest.fn(),
      revoke: jest.fn(),
      verify: jest.fn().mockReturnValue({
        id: 'user-1',
        username: 'basicUser',
        role: Role.BASIC,
      }),
    });

    const req = {
      headers: {
        authorization: 'Bearer token',
      },
    } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(req.user).toEqual({
      id: 'user-1',
      username: 'basicUser',
      role: Role.BASIC,
    });
    expect(req.authToken).toBe('token');
    expect(next).toHaveBeenCalled();
  });

  it('should throw UNAUTHORIZED when a payload is not valid', () => {
    const middleware = requireAuth({
      sign: jest.fn(),
      revoke: jest.fn(),
      verify: jest.fn().mockReturnValue(null),
    });

    const req = {
      headers: {
        authorization: 'Bearer invalid-token',
      },
    } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
