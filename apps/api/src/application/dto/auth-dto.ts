export interface LoginInput {
  login: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    displayName?: string;
  };
}
