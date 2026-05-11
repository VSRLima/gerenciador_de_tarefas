import { NextFunction, Request } from 'express';
import { swaggerBasicAuth } from '../../src/adapters/http/middlewares/swagger-basic-auth';
import { createMockResponse } from '../helpers/http';

describe('swaggerBasicAuth middleware', () => {
  it('returns 401 when the authorization header is missing', () => {
    const req = {
      headers: {},
    } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    swaggerBasicAuth(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Swagger"',
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Authentication required');
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when the credentials are invalid', () => {
    const req = {
      headers: {
        authorization: `Basic ${Buffer.from('swagger:wrong-pass').toString('base64')}`,
      },
    } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    swaggerBasicAuth(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Basic realm="Swagger"',
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith('Invalid credentials');
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when the credentials are valid', () => {
    const req = {
      headers: {
        authorization: `Basic ${Buffer.from('swagger:swagger').toString('base64')}`,
      },
    } as Request;
    const res = createMockResponse();
    const next = jest.fn() as NextFunction;

    swaggerBasicAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
