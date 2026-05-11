import { apiRequest } from './client';
import { AuthState } from '../types/auth';

export interface LoginPayload {
  login: string;
  password: string;
}

export const login = (payload: LoginPayload): Promise<AuthState> =>
  apiRequest<AuthState>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const logout = (token: string): Promise<null> =>
  apiRequest<null>('/auth/logout', {
    method: 'POST',
    token,
  });
