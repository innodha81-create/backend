import { Router } from 'express';
import signinRoleController from '../controllers/signinRole.controller.js';

const router = Router();

// 1. Actuator-like API Directory (GET /api/v1/signin-roles)
router.get('/', signinRoleController.getApiDirectory);

// 2. Read All Roles (GET /api/v1/signin-roles/list)
router.get('/list', signinRoleController.getAllRoles);

// 3. Read Single Role by ID (GET /api/v1/signin-roles/:id)
router.get('/:id', signinRoleController.getRoleById);

// 4. Create Role (POST /api/v1/signin-roles)
router.post('/', signinRoleController.createRole);

// 5. Update Role (PUT /api/v1/signin-roles/:id)
router.put('/:id', signinRoleController.updateRole);

// 6. Delete Role (DELETE /api/v1/signin-roles/:id)
router.delete('/:id', signinRoleController.deleteRole);

export default router;
