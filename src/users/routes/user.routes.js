import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import {
  validateUserId,
  validateCreateUser,
  validateUpdateUser,
  validatePaginationQuery
} from '../middlewares/user.validator.js';

const router = Router();

// 1. Actuator-like API Directory (GET /api/v1/users) - Public
router.get('/', userController.getApiDirectory);

// 2. User Stats (GET /api/v1/users/stats) - Public
router.get('/stats', userController.getUserStats);

// 3. Read All Users with Pagination & Filter (GET /api/v1/users/list) - Public
router.get('/list', validatePaginationQuery, userController.getAllUsers);

// 4. Read Single User by ID (GET /api/v1/users/:id) - Public
router.get('/:id', validateUserId, userController.getUserById);

// 5. Create User (POST /api/v1/users) - Public
router.post('/', validateCreateUser, userController.createUser);

// 6. Update User (PUT /api/v1/users/:id) - Public
router.put('/:id', validateUserId, validateUpdateUser, userController.updateUser);

// 7. Delete User (DELETE /api/v1/users/:id) - Public
router.delete('/:id', validateUserId, userController.deleteUser);

export default router;

