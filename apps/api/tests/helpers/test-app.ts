import { createApp } from '../../src/app';
import { AuthController } from '../../src/adapters/http/controllers/auth-controller';
import { TaskController } from '../../src/adapters/http/controllers/task-controller';
import { UserController } from '../../src/adapters/http/controllers/user-controller';
import { AuthService } from '../../src/application/services/auth-service';
import { TaskService } from '../../src/application/services/task-service';
import { UserService } from '../../src/application/services/user-service';
import { AuthenticatedUser } from '../../src/core/entities/user';
import { TokenServicePort } from '../../src/core/ports/token-service-port';

type AuthServiceMock = jest.Mocked<Pick<AuthService, 'login' | 'logout'>>;
type TaskServiceMock = jest.Mocked<
  Pick<TaskService, 'create' | 'list' | 'getById' | 'update' | 'delete'>
>;
type UserServiceMock = jest.Mocked<
  Pick<UserService, 'create' | 'list' | 'update' | 'delete'>
>;
type TokenServiceMock = jest.Mocked<TokenServicePort>;

interface CreateHttpTestAppInput {
  authService?: Partial<AuthServiceMock>;
  taskService?: Partial<TaskServiceMock>;
  userService?: Partial<UserServiceMock>;
  tokenPayloads?: Record<string, AuthenticatedUser | null>;
}

export const createHttpTestApp = ({
  authService: authServiceOverrides = {},
  taskService: taskServiceOverrides = {},
  userService: userServiceOverrides = {},
  tokenPayloads = {},
}: CreateHttpTestAppInput = {}) => {
  const authService = {
    login: jest.fn(),
    logout: jest.fn(),
    ...authServiceOverrides,
  } as AuthServiceMock;

  const taskService = {
    create: jest.fn(),
    list: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...taskServiceOverrides,
  } as TaskServiceMock;

  const userService = {
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...userServiceOverrides,
  } as UserServiceMock;

  const tokenService = {
    sign: jest.fn((payload: AuthenticatedUser) => `signed-${payload.id}`),
    verify: jest.fn((token: string) => tokenPayloads[token] ?? null),
    revoke: jest.fn(),
  } as TokenServiceMock;

  const app = createApp({
    authController: new AuthController(authService as unknown as AuthService),
    taskController: new TaskController(taskService as unknown as TaskService),
    userController: new UserController(userService as unknown as UserService),
    tokenService,
  });

  return {
    app,
    authService,
    taskService,
    tokenService,
    userService,
  };
};
