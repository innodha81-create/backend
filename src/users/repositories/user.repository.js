import { pool } from '../../config/database.js';

/**
 * User Repository
 * Handles direct database access and queries for the User entity.
 */
class UserRepository {
  /**
   * Find paginated users with dynamic filtering and sorting
   */
  async findPaginated({ whereClauses = [], values = [], limit = 10, offset = 0, sortBy = 'u.created_at', sortOrder = 'DESC' }) {
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryValues = [...values];
    queryValues.push(limit);
    const limitIdx = queryValues.length;
    queryValues.push(offset);
    const offsetIdx = queryValues.length;

    const query = `
      SELECT 
        u.user_id,
        u.name,
        u.username,
        u.email,
        u.employer,
        u.employee_code,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.signin_role_id AS role_id,
        r.signin_role_name AS role
      FROM users u
      LEFT JOIN signin_roles r ON u.signin_role_id = r.signin_role_id
      ${whereString}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await pool.query(query, queryValues);
    return result.rows;
  }

  /**
   * Count total users matching filters
   */
  async count({ whereClauses = [], values = [] }) {
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `
      SELECT COUNT(*) AS total 
      FROM users u
      LEFT JOIN signin_roles r ON u.signin_role_id = r.signin_role_id
      ${whereString}
    `;
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Find user by UUID
   */
  async findById(userId) {
    const query = `
      SELECT 
        u.user_id,
        u.name,
        u.username,
        u.email,
        u.employer,
        u.employee_code,
        u.is_active,
        u.created_at,
        u.updated_at,
        r.signin_role_id AS role_id,
        r.signin_role_name AS role
      FROM users u
      LEFT JOIN signin_roles r ON u.signin_role_id = r.signin_role_id
      WHERE u.user_id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Find existing user by Email
   */
  async findByEmail(email, excludeId = null) {
    let query = 'SELECT user_id, email FROM users WHERE LOWER(email) = LOWER($1)';
    const params = [email];
    if (excludeId) {
      query += ' AND user_id != $2';
      params.push(excludeId);
    }
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Find existing user by Username
   */
  async findByUsername(username, excludeId = null) {
    let query = 'SELECT user_id, username FROM users WHERE LOWER(username) = LOWER($1)';
    const params = [username];
    if (excludeId) {
      query += ' AND user_id != $2';
      params.push(excludeId);
    }
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Find role by Name or ID
   */
  async findRole(roleIdentifier) {
    const query = `
      SELECT signin_role_id, signin_role_name 
      FROM signin_roles 
      WHERE signin_role_id::text = $1 OR LOWER(signin_role_name) = LOWER($1)
    `;
    const result = await pool.query(query, [roleIdentifier]);
    return result.rows[0] || null;
  }

  /**
   * Get default role (User) if not provided
   */
  async getDefaultRole() {
    const query = `SELECT signin_role_id, signin_role_name FROM signin_roles ORDER BY created_at ASC LIMIT 1`;
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  async create({ name, username, email, employer, employee_code, signin_role_id, password_hash, is_active = true }) {
    const query = `
      INSERT INTO users (name, username, email, employer, employee_code, signin_role_id, password_hash, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING user_id, name, username, email, employer, employee_code, is_active, created_at, updated_at
    `;
    const result = await pool.query(query, [
      name,
      username,
      email,
      employer,
      employee_code,
      signin_role_id,
      password_hash,
      is_active
    ]);
    return result.rows[0];
  }

  /**
   * Update an existing user
   */
  async update(userId, updates = {}) {
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE user_id = $${idx}
      RETURNING user_id, name, username, email, employer, employee_code, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete a user
   */
  async delete(userId) {
    const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id, username, email';
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * User statistics
   */
  async getStats() {
    const query = `
      SELECT 
        COUNT(*) AS total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) AS active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) AS inactive_users,
        COUNT(DISTINCT employer) AS total_employers
      FROM users
    `;
    const result = await pool.query(query);
    return result.rows[0];
  }
}

export default new UserRepository();

