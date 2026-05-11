import { Role } from './auth';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  role: Role;
  createdAt: string;
}
