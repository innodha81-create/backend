import { Router } from 'express';
import siteController from '../controllers/site.controller.js';
import {
  validateSiteId,
  validateCreateSite,
  validateUpdateSite,
  validatePaginationQuery
} from '../middlewares/site.validator.js';

const router = Router();

// 1. Actuator-like API Directory (GET /api/v1/sites) - Public
router.get('/', siteController.getApiDirectory);

// 2. Site Analytics & Stats (GET /api/v1/sites/stats) - Public
router.get('/stats', siteController.getSiteStats);

// 3. Read All Sites with Pagination & Search (GET /api/v1/sites/list) - Public
router.get('/list', validatePaginationQuery, siteController.getAllSites);

// 4. Read Single Site by ID (GET /api/v1/sites/:id) - Public
router.get('/:id', validateSiteId, siteController.getSiteById);

// 5. Create Site (POST /api/v1/sites) - Public
router.post('/', validateCreateSite, siteController.createSite);

// 6. Update Site (PUT /api/v1/sites/:id) - Public
router.put('/:id', validateSiteId, validateUpdateSite, siteController.updateSite);

// 7. Delete Site (DELETE /api/v1/sites/:id) - Public
router.delete('/:id', validateSiteId, siteController.deleteSite);

export default router;
