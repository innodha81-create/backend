import { pool } from '../../config/database.js';

class SigninRoleService {
  getApiDirectory(baseUrl) {
    return {
      module: 'Signin Roles Management API',
      description: 'APIs for managing SignIn Roles (Fields: SignIn_ID, SignInRole_Name, created_at, updated_at)',
      totalEndpoints: 6,
      endpoints: [
        {
          method: 'GET',
          endpoint: `${baseUrl}`,
          description: 'Actuator-like API discovery directory (Lists all signin-role APIs)'
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/list`,
          description: 'Fetch all SignIn Roles'
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/:id`,
          description: 'Fetch a single SignIn Role by SignIn ID (UUID)'
        },
        {
          method: 'POST',
          endpoint: `${baseUrl}`,
          description: 'Create a new SignIn Role',
          bodyExample: {
            SignInRole_Name: 'Safety Officer'
          }
        },
        {
          method: 'PUT',
          endpoint: `${baseUrl}/:id`,
          description: 'Update a SignIn Role Name by SignIn ID',
          bodyExample: {
            SignInRole_Name: 'Senior Safety Officer'
          }
        },
        {
          method: 'DELETE',
          endpoint: `${baseUrl}/:id`,
          description: 'Permanently remove a SignIn Role by SignIn ID'
        }
      ]
    };
  }

  async getAllRoles() {
    const result = await pool.query(
      'SELECT signin_role_id, signin_role_name, created_at, updated_at FROM signin_roles ORDER BY created_at ASC'
    );
    return {
      total: result.rows.length,
      roles: result.rows.map(r => ({
        SignIn_ID: r.signin_role_id,
        SignInRole_Name: r.signin_role_name,
        created_at: r.created_at,
        updated_at: r.updated_at
      }))
    };
  }

  async getRoleById(id) {
    const result = await pool.query(
      'SELECT signin_role_id, signin_role_name, created_at, updated_at FROM signin_roles WHERE signin_role_id = $1',
      [id]
    );
    const role = result.rows[0];
    if (!role) {
      const error = new Error(`SignIn Role with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return {
      SignIn_ID: role.signin_role_id,
      SignInRole_Name: role.signin_role_name,
      created_at: role.created_at,
      updated_at: role.updated_at
    };
  }

  async createRole(roleName) {
    if (!roleName || !roleName.trim()) {
      const error = new Error('SignInRole_Name is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmed = roleName.trim();
    const existing = await pool.query(
      'SELECT signin_role_id FROM signin_roles WHERE LOWER(signin_role_name) = LOWER($1)',
      [trimmed]
    );

    if (existing.rows.length > 0) {
      const error = new Error(`SignIn Role with name '${trimmed}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const insertResult = await pool.query(
      `INSERT INTO signin_roles (signin_role_name)
       VALUES ($1)
       RETURNING signin_role_id, signin_role_name, created_at, updated_at`,
      [trimmed]
    );

    const created = insertResult.rows[0];
    return {
      SignIn_ID: created.signin_role_id,
      SignInRole_Name: created.signin_role_name,
      created_at: created.created_at,
      updated_at: created.updated_at
    };
  }

  async updateRole(id, roleName) {
    if (!roleName || !roleName.trim()) {
      const error = new Error('SignInRole_Name is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmed = roleName.trim();
    const checkRole = await pool.query(
      'SELECT signin_role_id FROM signin_roles WHERE signin_role_id = $1',
      [id]
    );
    if (checkRole.rows.length === 0) {
      const error = new Error(`SignIn Role with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const duplicateCheck = await pool.query(
      'SELECT signin_role_id FROM signin_roles WHERE LOWER(signin_role_name) = LOWER($1) AND signin_role_id != $2',
      [trimmed, id]
    );
    if (duplicateCheck.rows.length > 0) {
      const error = new Error(`SignIn Role with name '${trimmed}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const updateResult = await pool.query(
      `UPDATE signin_roles
       SET signin_role_name = $1, updated_at = CURRENT_TIMESTAMP
       WHERE signin_role_id = $2
       RETURNING signin_role_id, signin_role_name, created_at, updated_at`,
      [trimmed, id]
    );

    const updated = updateResult.rows[0];
    return {
      SignIn_ID: updated.signin_role_id,
      SignInRole_Name: updated.signin_role_name,
      created_at: updated.created_at,
      updated_at: updated.updated_at
    };
  }

  async deleteRole(id) {
    const result = await pool.query(
      'DELETE FROM signin_roles WHERE signin_role_id = $1 RETURNING signin_role_id, signin_role_name',
      [id]
    );
    const deleted = result.rows[0];
    if (!deleted) {
      const error = new Error(`SignIn Role with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return {
      message: `SignIn Role '${deleted.signin_role_name}' deleted successfully`,
      deletedRole: {
        SignIn_ID: deleted.signin_role_id,
        SignInRole_Name: deleted.signin_role_name
      }
    };
  }
}

export default new SigninRoleService();
