import { Request } from 'express';
import { UserController } from '../../src/adapters/http/controllers/user-controller';
import { UserService } from '../../src/application/services/user-service';
import { Role } from '../../src/core/enums/role';
import { AuthorizationError } from '../../src/core/errors/authorization-error';
import { ConflictError } from '../../src/core/errors/conflict-error';
import { NotFoundError } from '../../src/core/errors/not-found-error';
import { globalErrorHandler } from '../../src/shared/errors/error-handler';
import { createMockResponse } from '../helpers/http';

type UserControllerService = Pick<
  UserService,
  'create' | 'list' | 'update' | 'delete'
>;
type UserServiceMock = jest.Mocked<UserControllerService>;

const adminUser = {
  id: 'admin-1',
  username: 'admin',
  role: Role.ADMIN,
};

const basicUser = {
  id: 'basic-1',
  username: 'basic',
  role: Role.BASIC,
};

const buildManagedUser = (
  overrides: Partial<{
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    displayName?: string;
    role: Role;
    createdAt: Date;
  }> = {},
) => ({
  id: 'user-1',
  username: 'user-1',
  email: 'user-1@example.com',
  passwordHash: 'hashed-password',
  displayName: 'User 1',
  role: Role.BASIC,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const createRequest = (input: Partial<Request>): Request =>
  input as unknown as Request;

const createUserServiceMock = (
  overrides: Partial<UserServiceMock> = {},
): UserServiceMock =>
  ({
    create: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  }) as UserServiceMock;

const createDependencies = (overrides: Partial<UserServiceMock> = {}) => {
  const userServiceMock = createUserServiceMock(overrides);
  const controller = new UserController(
    userServiceMock as unknown as UserService,
  );

  return {
    userServiceMock,
    controller,
  };
};

const handleControllerError = async (
  req: Request,
  execute: (res: ReturnType<typeof createMockResponse>) => Promise<void>,
) => {
  const res = createMockResponse();

  try {
    await execute(res);
  } catch (error) {
    globalErrorHandler(error, req, res, jest.fn());
  }

  return res;
};

describe('UserController', () => {
  let userServiceMock: UserServiceMock;
  let controller: UserController;

  beforeEach(() => {
    ({ userServiceMock, controller } = createDependencies());
  });

  it('should throw ValidationError if the user is not authenticated when creating an user', async () => {
    const req = createRequest({
      body: {
        username: 'new-user',
        email: 'new@example.com',
        password: 'password123',
        role: Role.BASIC,
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userServiceMock.create).not.toHaveBeenCalled();
  });

  it('should throw schema error when the request is malformed when creating an user', async () => {
    const req = createRequest({
      user: adminUser,
      body: {
        username: 'ab',
        email: 'invalid-email',
        password: '123',
        role: 'INVALID',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userServiceMock.create).not.toHaveBeenCalled();
  });

  it('should throw AuthorizationError in case the user is not Admin when creating an user', async () => {
    userServiceMock.create.mockRejectedValue(
      new AuthorizationError('Only admins can manage users'),
    );

    const req = createRequest({
      user: basicUser,
      body: {
        username: 'new-user',
        email: 'new@example.com',
        password: 'password123',
        role: Role.BASIC,
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.create(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should create an user sucessfully with sanitized payload', async () => {
    userServiceMock.create.mockResolvedValue(
      buildManagedUser({
        id: 'user-2',
        username: 'new-user',
        email: 'new@example.com',
        displayName: 'New User',
      }),
    );

    const req = createRequest({
      user: adminUser,
      body: {
        username: 'new-user',
        email: 'new@example.com',
        password: 'password123',
        displayName: 'New User',
        role: Role.BASIC,
      },
    });
    const res = createMockResponse();

    await controller.create(req, res);

    expect(userServiceMock.create).toHaveBeenCalledWith(adminUser, req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'user-2',
          username: 'new-user',
          email: 'new@example.com',
        }),
      }),
    );
  });

  it('should list all users', async () => {
    userServiceMock.list.mockResolvedValue([
      buildManagedUser({ id: 'user-1', username: 'user-1' }),
      buildManagedUser({ id: 'user-2', username: 'user-2' }),
    ]);

    const req = createRequest({
      user: adminUser,
    });
    const res = createMockResponse();

    await controller.list(req, res);

    expect(userServiceMock.list).toHaveBeenCalledWith(adminUser);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw ValidationError if the user is not authenticated when listing users', async () => {
    const req = createRequest({});

    const res = await handleControllerError(req, (res) =>
      controller.list(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userServiceMock.list).not.toHaveBeenCalled();
  });

  it('should throw AuthorizationError in case the user is not Admin when listing an user', async () => {
    userServiceMock.list.mockRejectedValue(
      new AuthorizationError('Only admins can manage users'),
    );

    const req = createRequest({
      user: basicUser,
    });

    const res = await handleControllerError(req, (res) =>
      controller.list(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should update an user sucessfully', async () => {
    userServiceMock.update.mockResolvedValue(
      buildManagedUser({
        id: 'user-1',
        email: 'updated@example.com',
        displayName: 'Updated User',
      }),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'user-1' },
      body: {
        email: 'updated@example.com',
        displayName: 'Updated User',
      },
    });
    const res = createMockResponse();

    await controller.update(req, res);

    expect(userServiceMock.update).toHaveBeenCalledWith(
      adminUser,
      'user-1',
      req.body,
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw ValidationError if the user is not authenticated when updating an user', async () => {
    const req = createRequest({
      params: { id: 'user-1' },
      body: {
        email: 'updated@example.com',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userServiceMock.update).not.toHaveBeenCalled();
  });

  it('should throw schema error when the request is malformed when updating an user', async () => {
    const req = createRequest({
      user: adminUser,
      params: { id: 'user-1' },
      body: {
        email: 'invalid-email',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userServiceMock.update).not.toHaveBeenCalled();
  });

  it('should throw AuthorizationError in case the user is not Admin when updating an user', async () => {
    userServiceMock.update.mockRejectedValue(
      new AuthorizationError('Only admins can manage users'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'user-1' },
      body: {
        email: 'updated@example.com',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should throw NotFound when an user is not found', async () => {
    userServiceMock.update.mockRejectedValue(
      new NotFoundError('User not found'),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'missing-user' },
      body: {
        email: 'updated@example.com',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should throw ConflictError if the updating process is trying to update an user with an email that already exists', async () => {
    userServiceMock.update.mockRejectedValue(
      new ConflictError('Email is already in use'),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'user-1' },
      body: {
        email: 'taken@example.com',
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('should return 403 when an admin tries to change their own role', async () => {
    userServiceMock.update.mockRejectedValue(
      new AuthorizationError('Admins cannot change their own role'),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: adminUser.id },
      body: {
        role: Role.BASIC,
      },
    });

    const res = await handleControllerError(req, (res) =>
      controller.update(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should delete an user sucessfully', async () => {
    userServiceMock.delete.mockResolvedValue(undefined);

    const req = createRequest({
      user: adminUser,
      params: { id: 'user-1' },
    });
    const res = createMockResponse();

    await controller.delete(req, res);

    expect(userServiceMock.delete).toHaveBeenCalledWith(adminUser, 'user-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should throw ValidationError if the user is not authenticated when deleting an user', async () => {
    const req = createRequest({
      params: { id: 'user-1' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(userServiceMock.delete).not.toHaveBeenCalled();
  });

  it('should throw AuthorizationError in case the user is not Admin when deleting an user', async () => {
    userServiceMock.delete.mockRejectedValue(
      new AuthorizationError('Only admins can manage users'),
    );

    const req = createRequest({
      user: basicUser,
      params: { id: 'user-1' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("should throw NotFoundError if the user don't exists when deleting an user", async () => {
    userServiceMock.delete.mockRejectedValue(
      new NotFoundError('User not found'),
    );

    const req = createRequest({
      user: adminUser,
      params: { id: 'missing-user' },
    });

    const res = await handleControllerError(req, (res) =>
      controller.delete(req, res),
    );

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
