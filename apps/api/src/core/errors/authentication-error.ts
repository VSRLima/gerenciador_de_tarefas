import { AppError } from './app-error';

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', 401, message);
  }
}
