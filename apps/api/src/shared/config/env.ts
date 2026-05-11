import { z } from 'zod';
import { loadEnvironment } from './load-env';

loadEnvironment();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3001),
  MONGO_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SWAGGER_LOCAL_USER: z.string().default('swagger'),
  SWAGGER_LOCAL_PASS: z.string().default('swagger'),
  API_URL: z.string().default('http://localhost:3001'),
});

export const env = envSchema.parse(process.env);
