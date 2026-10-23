import { Router } from 'express';
import signinController from '../controllers/signin.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Actuator-like API Discovery Directory (GET /api/v1/signin)
router.get('/', signinController.getApiDirectory);

// 2. SignIn / Login (POST /api/v1/signin)
router.post('/', signinController.signIn);

// 3. SignOut / Logout (POST /api/v1/signin/signout) - Protected
router.post('/signout', authenticateToken, signinController.signOut);

// 4. Refresh Access Token (POST /api/v1/signin/refresh)
router.post('/refresh', signinController.refreshToken);

// 5. Current User Profile (GET /api/v1/signin/me) - Protected
router.get('/me', authenticateToken, signinController.getMe);

export default router;
