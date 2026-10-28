import { Router } from 'express';
import siteController from '../controllers/site.controller.js';
import {
  validateSiteId,
  validateCreateSite,
  validateUpdateSite,
  validatePaginationQuery
} from '../middlewares/site.validator.js';
import { requireAuth } from '../middlewares/site.auth.js';

const router = Router();

// All Site endpoints are fully protected — requireAuth applied to every route

// 1. Actuator-like API Directory (GET /api/v1/sites) - Protected
router.get('/', requireAuth, siteController.getApiDirectory);

// 2. Site Analytics & Stats (GET /api/v1/sites/stats) - Protected
router.get('/stats', requireAuth, siteController.getSiteStats);

// 3. Read All Sites with Pagination & Search (GET /api/v1/sites/list) - Protected
router.get('/list', requireAuth, validatePaginationQuery, siteController.getAllSites);

// 4. Read Single Site by ID (GET /api/v1/sites/:id) - Protected
router.get('/:id', requireAuth, validateSiteId, siteController.getSiteById);

// 5. Create Site (POST /api/v1/sites) - Protected
router.post('/', requireAuth, validateCreateSite, siteController.createSite);

// 6. Update Site (PUT /api/v1/sites/:id) - Protected
router.put('/:id', requireAuth, validateSiteId, validateUpdateSite, siteController.updateSite);

// 7. Delete Site (DELETE /api/v1/sites/:id) - Protected
router.delete('/:id', requireAuth, validateSiteId, siteController.deleteSite);

export default router;
