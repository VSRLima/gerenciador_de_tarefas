import bcrypt from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';
import { loadEnvironment } from '../src/shared/config/load-env';

loadEnvironment();

const prisma = new PrismaClient();

const users = [
  {
    username: 'basicUser',
    email: 'basic@example.com',
    password: 'basic123@',
    displayName: 'Basic User',
    role: Role.BASIC,
  },
  {
    username: 'adminUser',
    email: 'admin@example.com',
    password: 'admin123@',
    displayName: 'Admin User',
    role: Role.ADMIN,
  },
];

async function main(): Promise<void> {
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username: user.username }, { email: user.email }],
      },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          passwordHash,
          role: user.role,
        },
      });
      continue;
    }

    await prisma.user.create({
      data: {
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        passwordHash,
        role: user.role,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
