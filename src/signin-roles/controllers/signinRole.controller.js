import signinRoleService from '../services/signinRole.service.js';

class SigninRoleController {
  getApiDirectory(req, res) {
    const baseUrl = `${req.protocol}://${req.get('host')}/api/v1/signin-roles`;
    const directory = signinRoleService.getApiDirectory(baseUrl);
    res.status(200).json({
      success: true,
      data: directory
    });
  }

  async getAllRoles(req, res) {
    try {
      const result = await signinRoleService.getAllRoles();
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

  async getRoleById(req, res) {
    try {
      const { id } = req.params;
      const role = await signinRoleService.getRoleById(id);
      res.status(200).json({
        success: true,
        data: role
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async createRole(req, res) {
    try {
      // Support SignInRole_Name or roleName
      const roleName = req.body.SignInRole_Name || req.body.signin_role_name || req.body.roleName;
      const created = await signinRoleService.createRole(roleName);
      res.status(201).json({
        success: true,
        message: 'SignIn Role created successfully',
        data: created
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const roleName = req.body.SignInRole_Name || req.body.signin_role_name || req.body.roleName;
      const updated = await signinRoleService.updateRole(id, roleName);
      res.status(200).json({
        success: true,
        message: 'SignIn Role updated successfully',
        data: updated
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async deleteRole(req, res) {
    try {
      const { id } = req.params;
      const result = await signinRoleService.deleteRole(id);
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

export default new SigninRoleController();
