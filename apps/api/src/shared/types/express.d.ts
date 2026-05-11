import { AuthenticatedUser } from '../../core/entities/user';

declare global {
  namespace Express {
    interface Request {
      authToken?: string;
      user?: AuthenticatedUser;
    }
  }
}

export {};
