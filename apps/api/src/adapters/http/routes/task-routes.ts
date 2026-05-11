import { Router } from 'express';
import { TaskController } from '../controllers/task-controller';
import { asyncHandler } from '../../../shared/utils/async-handler';
import { requireAuth } from '../middlewares/require-auth';
import { TokenServicePort } from '../../../core/ports/token-service-port';

export const createTaskRoutes = (
  taskController: TaskController,
  tokenService: TokenServicePort,
): Router => {
  const router = Router();

  router.use(requireAuth(tokenService));
  router.get('/', asyncHandler(taskController.list));
  router.post('/', asyncHandler(taskController.create));
  router.get('/:id', asyncHandler(taskController.getById));
  router.patch('/:id', asyncHandler(taskController.update));
  router.delete('/:id', asyncHandler(taskController.delete));

  return router;
};
