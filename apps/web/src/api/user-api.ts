import { apiRequest } from './client';
import { User } from '../types/user';

export interface UserPayload {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  role: 'BASIC' | 'ADMIN';
}

export const listUsers = (token: string): Promise<User[]> =>
  apiRequest<User[]>('/users', { token });

export const createUser = (
  token: string,
  payload: UserPayload,
): Promise<User> =>
  apiRequest<User>('/users', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  });

export const updateUser = (
  token: string,
  userId: string,
  payload: Partial<UserPayload>,
): Promise<User> =>
  apiRequest<User>(`/users/${userId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(payload),
  });

export const deleteUser = (
  token: string,
  userId: string,
): Promise<{ id: string }> =>
  apiRequest<{ id: string }>(`/users/${userId}`, {
    method: 'DELETE',
    token,
  });
