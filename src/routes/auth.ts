import { Router } from 'express';
import userMiddleware from '../middlewares/user';
import authMiddleware from '../middlewares/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.get(
  '/me',
  userMiddleware,
  authMiddleware,
  asyncHandler(authController.me.bind(authController)),
);
router.post(
  '/register',
  asyncHandler(authController.register.bind(authController)),
);
router.post(
  '/signin',
  asyncHandler(authController.signin.bind(authController)),
);
router.post(
  '/signout',
  userMiddleware,
  authMiddleware,
  asyncHandler(authController.signout.bind(authController)),
);

export default router;
