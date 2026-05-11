import { CreateUserInput, UpdateUserInput } from '../dto/user-dto';
import { AdminAuthorizationService } from './admin-authorization-service';
import { AuthenticatedUser, User } from '../../core/entities/user';
import { AuthorizationError } from '../../core/errors/authorization-error';
import { ConflictError } from '../../core/errors/conflict-error';
import { NotFoundError } from '../../core/errors/not-found-error';
import { PasswordHasherPort } from '../../core/ports/password-hasher-port';
import { UserRepositoryPort } from '../../core/ports/user-repository-port';

export class UserService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly adminAuthorizationService: AdminAuthorizationService,
  ) {}

  public async create(
    actor: AuthenticatedUser,
    input: CreateUserInput,
  ): Promise<User> {
    this.adminAuthorizationService.ensureIsAdmin(actor);

    const existingUsername = await this.userRepository.findByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new ConflictError('Username is already in use');
    }

    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email is already in use');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      role: input.role,
    });
  }

  public async list(actor: AuthenticatedUser): Promise<User[]> {
    this.adminAuthorizationService.ensureIsAdmin(actor);
    return this.userRepository.list();
  }

  public async update(
    actor: AuthenticatedUser,
    userId: string,
    input: UpdateUserInput,
  ): Promise<User> {
    this.adminAuthorizationService.ensureIsAdmin(actor);

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    if (
      actor.id === userId &&
      input.role !== undefined &&
      input.role !== existingUser.role
    ) {
      throw new AuthorizationError('Admins cannot change their own role');
    }

    if (input.email && input.email !== existingUser.email) {
      const otherWithEmail = await this.userRepository.findByEmail(input.email);
      if (otherWithEmail) {
        throw new ConflictError('Email is already in use');
      }
    }

    return this.userRepository.update(userId, {
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      passwordHash: input.password
        ? await this.passwordHasher.hash(input.password)
        : undefined,
    });
  }

  public async delete(actor: AuthenticatedUser, userId: string): Promise<void> {
    this.adminAuthorizationService.ensureIsAdmin(actor);

    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.delete(userId);
  }
}
