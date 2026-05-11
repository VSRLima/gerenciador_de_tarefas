import { NextFunction, Request, Response } from 'express';
import { env } from '../../../shared/config/env';

export const swaggerBasicAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
    res.status(401).send('Authentication required');
    return;
  }

  const [, encodedCredentials] = authHeader.split(' ');
  const [username, password] = Buffer.from(encodedCredentials, 'base64')
    .toString('utf8')
    .split(':');

  if (
    username !== env.SWAGGER_LOCAL_USER ||
    password !== env.SWAGGER_LOCAL_PASS
  ) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
    res.status(401).send('Invalid credentials');
    return;
  }

  next();
};
