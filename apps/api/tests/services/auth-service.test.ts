import { AuthService } from '../../src/application/services/auth-service';
import { Role } from '../../src/core/enums/role';

const buildUser = (
  overrides: Partial<{
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    displayName: string;
    role: Role;
    createdAt: Date;
  }> = {},
) => ({
  id: 'user-1',
  username: 'basicUser',
  email: 'basic@example.com',
  passwordHash: 'hashed-password',
  displayName: 'Basic User',
  role: Role.BASIC,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

const createDependencies = () => {
  const userRepository = {
    findByUsernameOrEmail: jest.fn(),
  };
  const passwordHasher = {
    compare: jest.fn(),
  };
  const tokenService = {
    sign: jest.fn(),
    revoke: jest.fn(),
  };

  const service = new AuthService(
    userRepository as never,
    passwordHasher as never,
    tokenService as never,
  );

  return {
    userRepository,
    passwordHasher,
    tokenService,
    service,
  };
};

describe('AuthService', () => {
  let userRepository: ReturnType<typeof createDependencies>['userRepository'];
  let passwordHasher: ReturnType<typeof createDependencies>['passwordHasher'];
  let tokenService: ReturnType<typeof createDependencies>['tokenService'];
  let service: AuthService;

  beforeEach(() => {
    ({ userRepository, passwordHasher, tokenService, service } =
      createDependencies());
  });

  it('returns a signed token for valid credentials', async () => {
    userRepository.findByUsernameOrEmail.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.sign.mockReturnValue('token');

    const result = await service.login({
      login: 'basicUser',
      password: 'basic123@',
    });

    expect(userRepository.findByUsernameOrEmail).toHaveBeenCalledWith(
      'basicUser',
    );
    expect(passwordHasher.compare).toHaveBeenCalledWith(
      'basic123@',
      'hashed-password',
    );
    expect(tokenService.sign).toHaveBeenCalledWith({
      id: 'user-1',
      username: 'basicUser',
      role: Role.BASIC,
    });
    expect(result.token).toBe('token');
    expect(result.user.username).toBe('basicUser');
  });

  it('throws for invalid credentials when the user does not exist', async () => {
    userRepository.findByUsernameOrEmail.mockResolvedValue(null);

    await expect(
      service.login({
        login: 'unknown',
        password: 'unknown123',
      }),
    ).rejects.toThrow('Invalid credentials');

    expect(passwordHasher.compare).not.toHaveBeenCalled();
    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it('throws for invalid credentials when the password does not match', async () => {
    userRepository.findByUsernameOrEmail.mockResolvedValue(buildUser());
    passwordHasher.compare.mockResolvedValue(false);

    await expect(
      service.login({
        login: 'basicUser',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials');

    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it('revokes the authenticated token', async () => {
    await service.logout('token-1');

    expect(tokenService.revoke).toHaveBeenCalledWith('token-1');
  });
});
