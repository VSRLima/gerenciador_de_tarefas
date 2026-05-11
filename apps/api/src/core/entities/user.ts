import { Role } from '../enums/role';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  role: Role;
  createdAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: Role;
}
