import { Prisma, Role as PrismaRole } from '@prisma/client';
import {
  CreateUserRepositoryInput,
  UpdateUserRepositoryInput,
  UserRepositoryPort,
} from '../../core/ports/user-repository-port';
import { User } from '../../core/entities/user';
import { Role } from '../../core/enums/role';
import { prisma } from '../../database/prisma/prisma-client';

const toDomain = (user: {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  role: PrismaRole;
  createdAt: Date;
}): User => ({
  id: user.id,
  username: user.username,
  email: user.email,
  passwordHash: user.passwordHash,
  displayName: user.displayName ?? undefined,
  role: user.role as Role,
  createdAt: user.createdAt,
});

export class PrismaUserRepository implements UserRepositoryPort {
  public async create(input: CreateUserRepositoryInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash: input.passwordHash,
        displayName: input.displayName,
        role: input.role as PrismaRole,
      },
    });

    return toDomain(user);
  }

  public async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? toDomain(user) : null;
  }

  public async findByUsernameOrEmail(login: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: login }, { email: login }],
      },
    });

    return user ? toDomain(user) : null;
  }

  public async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { username } });
    return user ? toDomain(user) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? toDomain(user) : null;
  }

  public async list(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return users.map(toDomain);
  }

  public async update(
    id: string,
    input: UpdateUserRepositoryInput,
  ): Promise<User> {
    const data: Prisma.UserUpdateInput = {};

    if (input.email !== undefined) {
      data.email = input.email;
    }
    if (input.passwordHash !== undefined) {
      data.passwordHash = input.passwordHash;
    }
    if (input.displayName !== undefined) {
      data.displayName = input.displayName;
    }
    if (input.role !== undefined) {
      data.role = input.role as PrismaRole;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return toDomain(user);
  }

  public async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }
}
