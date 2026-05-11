import { Role } from '../../core/enums/role';
import { AuthorizationError } from '../../core/errors/authorization-error';
import { AuthenticatedUser } from '../../core/entities/user';

export class AdminAuthorizationService {
  public ensureIsAdmin(user: AuthenticatedUser): void {
    if (user.role !== Role.ADMIN) {
      throw new AuthorizationError('Only admins can manage users');
    }
  }
}
