import { NextFunction, Request, Response } from 'express';
import { TokenServicePort } from '../../../core/ports/token-service-port';
import { HttpStatus } from '../../../shared/http/http-status';

export const requireAuth =
  (tokenService: TokenServicePort) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header',
        },
      });
      return;
    }

    const token = authHeader.slice(7);
    const payload = tokenService.verify(token);

    if (!payload) {
      res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      });
      return;
    }

    req.user = payload;
    req.authToken = token;
    next();
  };
