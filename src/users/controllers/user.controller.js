import userService from '../services/user.service.js';

class UserController {
  getApiDirectory(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/users`;
    const directory = userService.getApiDirectory(baseUrl);
    res.status(200).json({
      success: true,
      data: directory
    });
  }

  async getUserStats(req, res) {
    try {
      const stats = await userService.getUserStats();
      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const pagination = req.pagination || {
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 10,
        search: req.query.search,
        employer: req.query.employer,
        role: req.query.role,
        sortBy: req.query.sortBy || 'created_at',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await userService.getAllUsers(pagination);
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

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createUser(req, res) {
    try {
      const payload = req.sanitizedBody || req.body;
      const created = await userService.createUser(payload);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: created
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updated = await userService.updateUser(id, req.body);
      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updated
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deleted = await userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: deleted
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new UserController();

