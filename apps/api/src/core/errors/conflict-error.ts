import { AppError } from './app-error';

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT_ERROR', 409, message);
  }
}
