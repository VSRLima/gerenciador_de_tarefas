import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { AuthController } from './adapters/http/controllers/auth-controller';
import { TaskController } from './adapters/http/controllers/task-controller';
import { UserController } from './adapters/http/controllers/user-controller';
import { openApiDocument } from './adapters/http/docs/openapi';
import { createAuthRoutes } from './adapters/http/routes/auth-routes';
import { createTaskRoutes } from './adapters/http/routes/task-routes';
import { createUserRoutes } from './adapters/http/routes/user-routes';
import { swaggerBasicAuth } from './adapters/http/middlewares/swagger-basic-auth';
import { sanitizeRequest } from './adapters/http/middlewares/sanitize-request';
import { TokenServicePort } from './core/ports/token-service-port';
import { globalErrorHandler } from './shared/errors/error-handler';
import { successResponse } from './shared/http/api-response';

interface AppControllers {
  authController: AuthController;
  taskController: TaskController;
  userController: UserController;
  tokenService: TokenServicePort;
}

export const createApp = ({
  authController,
  taskController,
  userController,
  tokenService,
}: AppControllers): Application => {
  const app = express();

  app.use(cors());
  app.use(helmet());
  app.use(express.json());
  app.use(sanitizeRequest);

  app.get('/health', (_req: Request, res: Response) => {
    res.json(successResponse({ status: 'ok' }));
  });

  app.use(
    '/docs',
    swaggerBasicAuth,
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument),
  );
  app.use('/api/auth', createAuthRoutes(authController, tokenService));
  app.use('/api/tasks', createTaskRoutes(taskController, tokenService));
  app.use('/api/users', createUserRoutes(userController, tokenService));

  app.use(globalErrorHandler);

  return app;
};
