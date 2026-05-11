import { LoginInput, LoginResult } from '../dto/auth-dto';
import { AuthenticationError } from '../../core/errors/authentication-error';
import { PasswordHasherPort } from '../../core/ports/password-hasher-port';
import { TokenServicePort } from '../../core/ports/token-service-port';
import { UserRepositoryPort } from '../../core/ports/user-repository-port';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenService: TokenServicePort,
  ) {}

  public async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByUsernameOrEmail(input.login);

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = this.tokenService.sign({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    };
  }

  public async logout(token: string): Promise<void> {
    this.tokenService.revoke(token);
  }
}
