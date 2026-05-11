import { Prisma } from '@prisma/client';
import {
  CreateTaskRepositoryInput,
  TaskFilters,
  TaskRepositoryPort,
  UpdateTaskRepositoryInput,
} from '../../core/ports/task-repository-port';
import { Task } from '../../core/entities/task';
import { prisma } from '../../database/prisma/prisma-client';

const toDomain = (task: {
  id: string;
  title: string;
  description: string | null;
  date: string;
  hour: string;
  scheduledFor: Date;
  isFinished: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    username: string;
    displayName: string | null;
  } | null;
}): Task => ({
  id: task.id,
  title: task.title,
  description: task.description ?? undefined,
  date: task.date,
  hour: task.hour,
  scheduledFor: task.scheduledFor,
  isFinished: task.isFinished,
  ownerId: task.ownerId,
  ownerName: task.owner
    ? (task.owner.displayName ?? task.owner.username)
    : undefined,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export class PrismaTaskRepository implements TaskRepositoryPort {
  public async create(input: CreateTaskRepositoryInput): Promise<Task> {
    const task = await prisma.task.create({
      data: input,
      include: {
        owner: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    return toDomain(task);
  }

  public async createMany(
    inputs: CreateTaskRepositoryInput[],
  ): Promise<number> {
    const response = await prisma.task.createMany({
      data: inputs,
    });

    return response.count;
  }

  public async findById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });
    return task ? toDomain(task) : null;
  }

  public async list(filters: TaskFilters): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = {};

    if (filters.ownerId) {
      where.ownerId = filters.ownerId;
    }

    if (filters.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    if (filters.status === 'finished') {
      where.isFinished = true;
    }

    if (filters.status === 'pending') {
      where.isFinished = false;
    }

    if (filters.status === 'scheduled') {
      where.isFinished = false;
      where.scheduledFor = {
        gte: filters.now,
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { scheduledFor: 'asc' },
      include: {
        owner: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    return tasks.map(toDomain);
  }

  public async update(
    id: string,
    input: UpdateTaskRepositoryInput,
  ): Promise<Task> {
    const task = await prisma.task.update({
      where: { id },
      data: input,
      include: {
        owner: {
          select: {
            username: true,
            displayName: true,
          },
        },
      },
    });

    return toDomain(task);
  }

  public async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }

  public async findDueUnfinished(now: Date): Promise<Task[]> {
    const tasks = await prisma.task.findMany({
      where: {
        isFinished: false,
        scheduledFor: {
          lte: now,
        },
      },
    });

    return tasks.map(toDomain);
  }

  public async markAsFinished(ids: string[]): Promise<number> {
    const response = await prisma.task.updateMany({
      where: { id: { in: ids } },
      data: { isFinished: true },
    });

    return response.count;
  }
}
