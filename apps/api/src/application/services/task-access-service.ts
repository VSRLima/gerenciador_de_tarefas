import { Role } from '../../core/enums/role';
import { AuthorizationError } from '../../core/errors/authorization-error';
import { Task } from '../../core/entities/task';
import { AuthenticatedUser } from '../../core/entities/user';

export class TaskAccessService {
  public ensureCanAccess(user: AuthenticatedUser, task: Task): void {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (task.ownerId !== user.id) {
      throw new AuthorizationError(
        'This task does not belong to the authenticated user',
      );
    }
  }
}
