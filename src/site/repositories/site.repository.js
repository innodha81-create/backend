import { pool } from '../../config/database.js';

/**
 * Site Repository
 * Handles all direct database access, SQL queries, and transactions for the Site entity.
 */
class SiteRepository {
  /**
   * Find sites with dynamic WHERE filtering, sorting, and pagination
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
      FROM sites
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
    const query = `SELECT COUNT(*) AS total FROM sites ${whereString}`;
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].total, 10);
  }

  /**
   * Find site by primary key UUID
   */
  async findById(id) {
    const result = await pool.query('SELECT * FROM sites WHERE site_id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Find site by name (case-insensitive)
   */
  async findByName(name) {
    const result = await pool.query(
      'SELECT * FROM sites WHERE LOWER(name) = LOWER($1)',
      [name]
    );
    return result.rows[0] || null;
  }

  /**
   * Find duplicate name excluding current site ID
   */
  async findDuplicateName(name, excludeId) {
    const result = await pool.query(
      'SELECT site_id FROM sites WHERE LOWER(name) = LOWER($1) AND site_id != $2',
      [name, excludeId]
    );
    return result.rows[0] || null;
  }

  /**
   * Insert a new site record into database
   */
  async create({ name, description }) {
    const query = `
      INSERT INTO sites (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [name, description]);
    return result.rows[0];
  }

  /**
   * Update an existing site record
   */
  async update(id, { name, description }) {
    const query = `
      UPDATE sites
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE site_id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [name, description, id]);
    return result.rows[0];
  }

  /**
   * Delete site by UUID
   */
  async delete(id) {
    const query = 'DELETE FROM sites WHERE site_id = $1 RETURNING site_id, name';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Aggregates total sites count
   */
  async getSiteAnalytics() {
    const totalQuery = await pool.query('SELECT COUNT(*) AS total FROM sites');
    const total = parseInt(totalQuery.rows[0].total, 10);
    return { total };
  }
}

export default new SiteRepository();
