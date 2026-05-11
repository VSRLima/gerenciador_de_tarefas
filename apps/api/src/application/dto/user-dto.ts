import { Role } from '../../core/enums/role';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role: Role;
}

export interface UpdateUserInput {
  email?: string;
  password?: string;
  displayName?: string;
  role?: Role;
}
