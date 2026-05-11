import { AuthState } from '../types/auth';

const authStorageKey = 'task-manager-auth';

export const loadAuthState = (): AuthState | null => {
  const rawValue = localStorage.getItem(authStorageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthState;
  } catch {
    localStorage.removeItem(authStorageKey);
    return null;
  }
};

export const saveAuthState = (authState: AuthState): void => {
  localStorage.setItem(authStorageKey, JSON.stringify(authState));
};

export const clearAuthState = (): void => {
  localStorage.removeItem(authStorageKey);
};
