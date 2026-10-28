import { pool } from '../../config/database.js';

/**
 * Project Repository
 * Handles all direct database access, SQL queries, and transactions for the Project entity.
 */
class ProjectRepository {
  /**
   * Find projects with dynamic WHERE filtering, sorting, and pagination
   */
  async findPaginated({ whereClauses = [], values = [], limit = 10, offset = 0, sortBy = 'created_at', sortOrder = 'DESC' }) {
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const queryValues = [...values];
    queryValues.push(limit);
    const limitIdx = queryValues.length;
    queryValues.push(offset);
    const offsetIdx = queryValues.length;

    const query = `
      SELECT *
      FROM projects
      ${whereString}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const result = await pool.query(query, queryValues);
    return result.rows;
  }

  /**
   * Count total matching records with given WHERE filters
   */
  async count({ whereClauses = [], values = [] }) {
    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const query = `SELECT COUNT(*) AS total FROM projects ${whereString}`;
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Find project by primary key UUID
   */
  async findById(id) {
    const result = await pool.query('SELECT * FROM projects WHERE project_id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find project by project code (case-insensitive)
   */
  async findByCode(code) {
    const result = await pool.query(
      'SELECT * FROM projects WHERE LOWER(project_code) = LOWER($1)',
      [code]
    );
    return result.rows[0] || null;
  }

  /**
   * Find duplicate project code excluding current project ID
   */
  async findDuplicateCode(code, excludeId) {
    const result = await pool.query(
      'SELECT project_id FROM projects WHERE LOWER(project_code) = LOWER($1) AND project_id != $2',
      [code, excludeId]
    );
    return result.rows[0] || null;
  }

  /**
   * Insert a new project record into database
   */
  async create({ projectName, projectCode, client, riskLevel, description, userId = null }) {
    const query = `
      INSERT INTO projects (project_name, project_code, client, risk_level, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
    `;
    const result = await pool.query(query, [
      projectName,
      projectCode,
      client,
      riskLevel,
      description,
      userId
    ]);
    return result.rows[0];
  }

  /**
   * Update an existing project record
   */
  async update(id, { projectName, projectCode, client, riskLevel, description }) {
    const query = `
      UPDATE projects
      SET project_name = $1, project_code = $2, client = $3, risk_level = $4, description = $5, updated_at = CURRENT_TIMESTAMP
      WHERE project_id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [
      projectName,
      projectCode,
      client,
      riskLevel,
      description,
      id
    ]);
    return result.rows[0];
  }

  /**
   * Delete project by UUID
   */
  async delete(id) {
    const query = 'DELETE FROM projects WHERE project_id = $1 RETURNING project_id, project_name';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Aggregates total projects and breakdown by risk_level
   */
  async getRiskAnalytics() {
    const totalQuery = await pool.query('SELECT COUNT(*) AS total FROM projects');
    const total = parseInt(totalQuery.rows[0].total, 10);

    const groupQuery = await pool.query(`
      SELECT 
        COALESCE(LOWER(risk_level), 'unassigned') AS risk_level, 
        COUNT(*) AS count 
      FROM projects 
      GROUP BY LOWER(risk_level)
    `);

    const breakdown = { easy: 0, medium: 0, high: 0 };
    groupQuery.rows.forEach(r => {
      if (r.risk_level in breakdown) {
        breakdown[r.risk_level] = parseInt(r.count, 10);
      }
    });

    return { total, breakdown };
  }
}

export default new ProjectRepository();
