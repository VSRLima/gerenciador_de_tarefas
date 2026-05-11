import { z } from 'zod';
import { Role } from '../../../core/enums/role';

export const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(8),
});

const taskInputSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hour: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  isFinished: z.boolean().optional(),
});

export const createTasksSchema = z.union([
  taskInputSchema,
  z.object({
    tasks: z.array(taskInputSchema).min(1).max(5000),
  }),
]);

export const updateTaskSchema = taskInputSchema.partial();

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100).optional(),
  role: z.nativeEnum(Role),
});

export const updateUserSchema = createUserSchema
  .omit({ username: true })
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: 'At least one field must be provided',
  });
