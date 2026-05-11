import { AdminAuthorizationService } from '../../src/application/services/admin-authorization-service';
import { UserService } from '../../src/application/services/user-service';
import { Role } from '../../src/core/enums/role';

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

const buildUser = (
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

const createDependencies = () => {
  const userRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByUsernameOrEmail: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    list: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const passwordHasher = {
    hash: jest.fn().mockResolvedValue('hashed-password'),
  };

  const service = new UserService(
    userRepository as never,
    passwordHasher as never,
    new AdminAuthorizationService(),
  );

  return {
    userRepository,
    passwordHasher,
    service,
  };
};

describe('UserService', () => {
  it('creates a user successfully', async () => {
    const { service, userRepository, passwordHasher } = createDependencies();
    const createdUser = buildUser({
      username: 'new-user',
      email: 'new@example.com',
    });

    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockResolvedValue(createdUser);

    const result = await service.create(adminUser, {
      username: 'new-user',
      email: 'new@example.com',
      password: 'password123',
      displayName: 'New User',
      role: Role.BASIC,
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(userRepository.create).toHaveBeenCalledWith({
      username: 'new-user',
      email: 'new@example.com',
      passwordHash: 'hashed-password',
      displayName: 'New User',
      role: Role.BASIC,
    });
    expect(result).toEqual(createdUser);
  });

  it('throws ConflictError when username is already in use', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findByUsername.mockResolvedValue(buildUser());

    await expect(
      service.create(adminUser, {
        username: 'existing-user',
        email: 'new@example.com',
        password: 'password123',
        role: Role.BASIC,
      }),
    ).rejects.toThrow('Username is already in use');
  });

  it('throws ConflictError when email is already in use', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findByUsername.mockResolvedValue(null);
    userRepository.findByEmail.mockResolvedValue(buildUser());

    await expect(
      service.create(adminUser, {
        username: 'new-user',
        email: 'existing@example.com',
        password: 'password123',
        role: Role.BASIC,
      }),
    ).rejects.toThrow('Email is already in use');
  });

  it('throws AuthorizationError when a basic user tries to create a user', async () => {
    const { service } = createDependencies();

    await expect(
      service.create(basicUser, {
        username: 'new-user',
        email: 'new@example.com',
        password: 'password123',
        role: Role.BASIC,
      }),
    ).rejects.toThrow('Only admins can manage users');
  });

  it('lists all users for admin', async () => {
    const { service, userRepository } = createDependencies();
    const users = [
      buildUser(),
      buildUser({ id: 'user-2', username: 'user-2' }),
    ];
    userRepository.list.mockResolvedValue(users);

    const result = await service.list(adminUser);

    expect(userRepository.list).toHaveBeenCalled();
    expect(result).toEqual(users);
  });

  it('throws AuthorizationError when a basic user tries to list users', async () => {
    const { service } = createDependencies();

    await expect(service.list(basicUser)).rejects.toThrow(
      'Only admins can manage users',
    );
  });

  it('updates a user successfully', async () => {
    const { service, userRepository, passwordHasher } = createDependencies();
    const existingUser = buildUser();
    const updatedUser = buildUser({
      email: 'updated@example.com',
      displayName: 'Updated User',
      role: Role.ADMIN,
    });

    userRepository.findById.mockResolvedValue(existingUser);
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.update.mockResolvedValue(updatedUser);

    const result = await service.update(adminUser, existingUser.id, {
      email: 'updated@example.com',
      password: 'password123',
      displayName: 'Updated User',
      role: Role.ADMIN,
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith('password123');
    expect(userRepository.update).toHaveBeenCalledWith(existingUser.id, {
      email: 'updated@example.com',
      displayName: 'Updated User',
      role: Role.ADMIN,
      passwordHash: 'hashed-password',
    });
    expect(result).toEqual(updatedUser);
  });

  it('throws NotFoundError when updating a missing user', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findById.mockResolvedValue(null);

    await expect(
      service.update(adminUser, 'missing-user', {
        email: 'updated@example.com',
      }),
    ).rejects.toThrow('User not found');
  });

  it('throws ConflictError when updating with an email that already exists', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findById.mockResolvedValue(buildUser());
    userRepository.findByEmail.mockResolvedValue(buildUser({ id: 'user-2' }));

    await expect(
      service.update(adminUser, 'user-1', {
        email: 'taken@example.com',
      }),
    ).rejects.toThrow('Email is already in use');
  });

  it('throws AuthorizationError when a basic user tries to update a user', async () => {
    const { service } = createDependencies();

    await expect(
      service.update(basicUser, 'user-1', {
        email: 'updated@example.com',
      }),
    ).rejects.toThrow('Only admins can manage users');
  });

  it('prevents an admin from changing their own role', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findById.mockResolvedValue(
      buildUser({
        id: adminUser.id,
        username: adminUser.username,
        role: Role.ADMIN,
      }),
    );

    await expect(
      service.update(adminUser, adminUser.id, {
        role: Role.BASIC,
      }),
    ).rejects.toThrow('Admins cannot change their own role');
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('deletes a user successfully', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findById.mockResolvedValue(buildUser());
    userRepository.delete.mockResolvedValue(undefined);

    await service.delete(adminUser, 'user-1');

    expect(userRepository.delete).toHaveBeenCalledWith('user-1');
  });

  it('throws NotFoundError when deleting a missing user', async () => {
    const { service, userRepository } = createDependencies();
    userRepository.findById.mockResolvedValue(null);

    await expect(service.delete(adminUser, 'missing-user')).rejects.toThrow(
      'User not found',
    );
  });

  it('throws AuthorizationError when a basic user tries to delete a user', async () => {
    const { service } = createDependencies();

    await expect(service.delete(basicUser, 'user-1')).rejects.toThrow(
      'Only admins can manage users',
    );
  });
});
