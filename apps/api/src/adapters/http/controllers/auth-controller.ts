import { Request, Response } from 'express';
import { AuthService } from '../../../application/services/auth-service';
import { loginSchema } from '../validators/request-schemas';
import { successResponse } from '../../../shared/http/api-response';
import { HttpStatus } from '../../../shared/http/http-status';
import { ValidationError } from '../../../core/errors/validation-error';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  public login = async (req: Request, res: Response): Promise<void> => {
    const input = loginSchema.parse(req.body);
    const result = await this.authService.login(input);
    res.status(HttpStatus.OK).json(successResponse(result, 'Login successful'));
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    if (!req.authToken) {
      throw new ValidationError('Authenticated token is missing');
    }

    await this.authService.logout(req.authToken);
    res.status(HttpStatus.OK).json(successResponse(null, 'Logout successful'));
  };
}
