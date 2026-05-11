import { Request, Response } from 'express';
import { ValidationError } from '../../../core/errors/validation-error';
import { successResponse } from '../../../shared/http/api-response';
import { HttpStatus } from '../../../shared/http/http-status';
import { UserService } from '../../../application/services/user-service';
import {
  createUserSchema,
  updateUserSchema,
} from '../validators/request-schemas';

const sanitizeUser = (user: {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  createdAt: Date;
}) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  createdAt: user.createdAt,
});

export class UserController {
  constructor(private readonly userService: UserService) {}

  public create = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const input = createUserSchema.parse(req.body);
    const user = await this.userService.create(req.user, input);
    res
      .status(HttpStatus.CREATED)
      .json(successResponse(sanitizeUser(user), 'User created successfully'));
  };

  public list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const users = await this.userService.list(req.user);
    res.status(HttpStatus.OK).json(successResponse(users.map(sanitizeUser)));
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const input = updateUserSchema.parse(req.body);
    const userId = String(req.params.id);
    const user = await this.userService.update(req.user, userId, input);
    res
      .status(HttpStatus.OK)
      .json(successResponse(sanitizeUser(user), 'User updated successfully'));
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const userId = String(req.params.id);
    await this.userService.delete(req.user, userId);
    res
      .status(HttpStatus.OK)
      .json(successResponse({ id: userId }, 'User deleted successfully'));
  };
}
