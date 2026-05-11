import { Router } from 'express';
import { UserController } from '../controllers/user-controller';
import { asyncHandler } from '../../../shared/utils/async-handler';
import { requireAuth } from '../middlewares/require-auth';
import { TokenServicePort } from '../../../core/ports/token-service-port';

export const createUserRoutes = (
  userController: UserController,
  tokenService: TokenServicePort,
): Router => {
  const router = Router();

  router.use(requireAuth(tokenService));
  router.get('/', asyncHandler(userController.list));
  router.post('/', asyncHandler(userController.create));
  router.patch('/:id', asyncHandler(userController.update));
  router.delete('/:id', asyncHandler(userController.delete));

  return router;
};
