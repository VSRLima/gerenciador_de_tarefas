import { Role } from '../enums/role';
import { User } from '../entities/user';

export interface CreateUserRepositoryInput {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  role: Role;
}

export interface UpdateUserRepositoryInput {
  email?: string;
  passwordHash?: string;
  displayName?: string;
  role?: Role;
}

export interface UserRepositoryPort {
  create(input: CreateUserRepositoryInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsernameOrEmail(login: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(): Promise<User[]>;
  update(id: string, input: UpdateUserRepositoryInput): Promise<User>;
  delete(id: string): Promise<void>;
}
