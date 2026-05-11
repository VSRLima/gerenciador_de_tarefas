import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  login as loginRequest,
  LoginPayload,
  logout as logoutRequest,
} from '../api/auth-api';
import { AuthState } from '../types/auth';
import { clearAuthState, loadAuthState, saveAuthState } from '../utils/storage';

interface AuthContextValue {
  authState: AuthState | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren): JSX.Element => {
  const [authState, setAuthState] = useState<AuthState | null>(() =>
    loadAuthState(),
  );

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginRequest(payload);
    setAuthState(result);
    saveAuthState(result);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (authState?.token) {
        await logoutRequest(authState.token);
      }
    } finally {
      setAuthState(null);
      clearAuthState();
    }
  }, [authState]);

  const value = useMemo(
    () => ({
      authState,
      login,
      logout,
    }),
    [authState, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
};
