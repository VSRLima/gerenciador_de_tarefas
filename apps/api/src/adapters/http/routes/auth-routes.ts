import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { asyncHandler } from '../../../shared/utils/async-handler';
import { requireAuth } from '../middlewares/require-auth';
import { TokenServicePort } from '../../../core/ports/token-service-port';

export const createAuthRoutes = (
  authController: AuthController,
  tokenService: TokenServicePort,
): Router => {
  const router = Router();

  router.post('/login', asyncHandler(authController.login));
  router.post(
    '/logout',
    requireAuth(tokenService),
    asyncHandler(authController.logout),
  );

  return router;
};
