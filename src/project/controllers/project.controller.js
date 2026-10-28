import projectService from '../services/project.service.js';

class ProjectController {
  getApiDirectory(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/projects`;
    const directory = projectService.getApiDirectory(baseUrl);
    res.status(200).json({
      success: true,
      data: directory
    });
  }

  async getProjectStats(req, res) {
    try {
      const stats = await projectService.getProjectStats();
      res.status(200).json({
        success: true,
        message: 'Project analytics retrieved successfully',
        data: stats
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllProjects(req, res) {
    try {
      const pagination = req.pagination || {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        search: req.query.search,
        risk_level: req.query.risk_level,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await projectService.getAllProjects(pagination);
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

  async getProjectById(req, res) {
    try {
      const { id } = req.params;
      const project = await projectService.getProjectById(id);
      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createProject(req, res) {
    try {
      const payload = req.sanitizedBody || req.body;
      const userId = req.user?.user_id || null;
      const created = await projectService.createProject(payload, userId);
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: created
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateProject(req, res) {
    try {
      const { id } = req.params;
      const updated = await projectService.updateProject(id, req.body);
      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updated
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteProject(req, res) {
    try {
      const { id } = req.params;
      const result = await projectService.deleteProject(id);
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

export default new ProjectController();
