export type Role = 'BASIC' | 'ADMIN';

export interface AuthUser {
  id: string;
  username: string;
  displayName?: string;
  role: Role;
}

export interface AuthState {
  token: string;
  user: AuthUser;
}
