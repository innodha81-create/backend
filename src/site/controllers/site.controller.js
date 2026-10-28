import siteService from '../services/site.service.js';

class SiteController {
  getApiDirectory(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/sites`;
    const directory = siteService.getApiDirectory(baseUrl);
    res.status(200).json({
      success: true,
      data: directory
    });
  }

  async getSiteStats(req, res) {
    try {
      const stats = await siteService.getSiteStats();
      res.status(200).json({
        success: true,
        message: 'Site analytics retrieved successfully',
        data: stats
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllSites(req, res) {
    try {
      const pagination = req.pagination || {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        search: req.query.search,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await siteService.getAllSites(pagination);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getSiteById(req, res) {
    try {
      const { id } = req.params;
      const site = await siteService.getSiteById(id);
      res.status(200).json({
        success: true,
        data: site
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createSite(req, res) {
    try {
      const payload = req.sanitizedBody || req.body;
      const created = await siteService.createSite(payload);
      res.status(201).json({
        success: true,
        message: 'Site created successfully',
        data: created
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateSite(req, res) {
    try {
      const { id } = req.params;
      const updated = await siteService.updateSite(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Site updated successfully',
        data: updated
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteSite(req, res) {
    try {
      const { id } = req.params;
      const result = await siteService.deleteSite(id);
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new SiteController();
