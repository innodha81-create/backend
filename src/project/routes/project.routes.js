import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import {
  validateProjectId,
  validateCreateProject,
  validateUpdateProject,
  validatePaginationQuery
} from '../middlewares/project.validator.js';
import { optionalAuth, requireAuth } from '../middlewares/project.auth.js';

const router = Router();

// 1. Actuator-like API Directory (GET /api/v1/projects) - Public
router.get('/', projectController.getApiDirectory);

// 2. Project Analytics & Risk Stats (GET /api/v1/projects/stats) - Public
router.get('/stats', projectController.getProjectStats);

// 3. Read All Projects with Pagination, Search & Filter (GET /api/v1/projects/list) - Public / Optional Auth
router.get('/list', optionalAuth, validatePaginationQuery, projectController.getAllProjects);

// 4. Read Single Project by ID (GET /api/v1/projects/:id) - Public / Optional Auth
router.get('/:id', optionalAuth, validateProjectId, projectController.getProjectById);

// 5. Create Project (POST /api/v1/projects) - Strictly Protected (Requires Login)
router.post('/', requireAuth, validateCreateProject, projectController.createProject);

// 6. Update Project (PUT /api/v1/projects/:id) - Strictly Protected (Requires Login)
router.put('/:id', requireAuth, validateProjectId, validateUpdateProject, projectController.updateProject);

// 7. Delete Project (DELETE /api/v1/projects/:id) - Strictly Protected (Requires Login)
router.delete('/:id', requireAuth, validateProjectId, projectController.deleteProject);

export default router;
