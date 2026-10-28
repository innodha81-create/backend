import siteRepository from '../repositories/site.repository.js';

const ALLOWED_SORT_COLUMNS = ['created_at', 'name', 'description'];

/**
 * Site Service (Business Logic Layer)
 * Coordinates repository operations and validates domain rules.
 */
class SiteService {
  /**
   * Self-documenting API discovery directory (Actuator-style)
   */
  getApiDirectory(baseUrl) {
    return {
      module: 'Site Management API',
      version: '1.0.0',
      architecture: 'Routes -> Middlewares -> Controllers -> Services -> Repositories -> Database',
      totalEndpoints: 7,
      fields: {
        site_id: 'UUID (Primary Key, Auto-generated)',
        name: 'String (Required, Unique, 2-255 chars)',
        description: 'String (Required, 2-1000 chars)',
        status: 'String (Default: ACTIVE)',
        created_at: 'Timestamp (Auto)',
        updated_at: 'Timestamp (Auto)'
      },
      endpoints: [
        {
          method: 'GET',
          endpoint: `${baseUrl}`,
          description: 'Actuator API discovery directory'
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/stats`,
          description: 'Site Analytics Summary (Total sites count)'
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/list`,
          description: 'Fetch sites with pagination and full-text search',
          queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10, max: 100)',
            search: 'Search text across name and description (ILIKE query)',
            sortBy: "Sort column ('created_at' | 'name' | 'description')",
            sortOrder: "Sort direction ('ASC' | 'DESC', default: 'DESC')"
          },
          exampleUrl: `${baseUrl}/list?page=1&limit=10&search=main&sortBy=created_at&sortOrder=DESC`
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/:id`,
          description: 'Fetch a single Site by UUID'
        },
        {
          method: 'POST',
          endpoint: `${baseUrl}`,
          description: 'Create a new Site (Requires name, description)',
          bodyExample: {
            name: 'Main Site',
            description: 'The primary production site'
          }
        },
        {
          method: 'PUT',
          endpoint: `${baseUrl}/:id`,
          description: 'Update an existing Site by UUID',
          bodyExample: {
            name: 'Updated Site Name',
            description: 'Updated description'
          }
        },
        {
          method: 'DELETE',
          endpoint: `${baseUrl}/:id`,
          description: 'Permanently remove a Site by UUID'
        }
      ]
    };
  }

  /**
   * Get site analytics and stats
   */
  async getSiteStats() {
    const { total } = await siteRepository.getSiteAnalytics();
    return { total };
  }

  /**
   * Fetch paginated list of sites with search and filters
   */
  async getAllSites(pagination = {}) {
    const {
      page = 1,
      limit = 10,
      offset = 0,
      search = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    // Whitelist sortBy to prevent SQL injection
    const safeSortBy = ALLOWED_SORT_COLUMNS.includes(sortBy) ? sortBy : 'created_at';

    const whereClauses = [];
    const values = [];

    // Filter by search keyword across name and description
    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;
      whereClauses.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
    }

    // 1. Get total count
    const total = await siteRepository.count({ whereClauses, values });

    // 2. Get records from repository
    const sites = await siteRepository.findPaginated({
      whereClauses,
      values,
      limit,
      offset,
      sortBy: safeSortBy,
      sortOrder
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filtersApplied: {
        search,
        sortBy: safeSortBy,
        sortOrder
      },
      sites
    };
  }

  /**
   * Fetch single site by ID
   */
  async getSiteById(id) {
    const site = await siteRepository.findById(id);
    if (!site) {
      const error = new Error(`Site with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return site;
  }

  /**
   * Create a new site
   */
  async createSite(rawData) {
    const name = (rawData.name || '').trim();
    const description = (rawData.description || '').trim();

    if (!name) {
      const error = new Error('name is required');
      error.statusCode = 400;
      throw error;
    }

    if (name.length < 2 || name.length > 255) {
      const error = new Error('name must be between 2 and 255 characters');
      error.statusCode = 400;
      throw error;
    }

    if (!description) {
      const error = new Error('description is required');
      error.statusCode = 400;
      throw error;
    }

    if (description.length < 2 || description.length > 1000) {
      const error = new Error('description must be between 2 and 1000 characters');
      error.statusCode = 400;
      throw error;
    }

    // Unique name check
    const existing = await siteRepository.findByName(name);
    if (existing) {
      const error = new Error(`Site with name '${name}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    return await siteRepository.create({ name, description });
  }

  /**
   * Update an existing site
   */
  async updateSite(id, rawData) {
    const existing = await siteRepository.findById(id);
    if (!existing) {
      const error = new Error(`Site with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const name = rawData.name !== undefined ? rawData.name.trim() : existing.name;
    const description = rawData.description !== undefined ? rawData.description.trim() : existing.description;

    // Name validation if being updated
    if (rawData.name !== undefined) {
      if (!name || name.length < 2 || name.length > 255) {
        const error = new Error('name must be between 2 and 255 characters');
        error.statusCode = 400;
        throw error;
      }
      const duplicate = await siteRepository.findDuplicateName(name, id);
      if (duplicate) {
        const error = new Error(`Site with name '${name}' already exists`);
        error.statusCode = 409;
        throw error;
      }
    }

    // Description validation if being updated
    if (rawData.description !== undefined) {
      if (!description || description.length < 2 || description.length > 1000) {
        const error = new Error('description must be between 2 and 1000 characters');
        error.statusCode = 400;
        throw error;
      }
    }

    return await siteRepository.update(id, { name, description });
  }

  /**
   * Delete a site
   */
  async deleteSite(id) {
    const deleted = await siteRepository.delete(id);
    if (!deleted) {
      const error = new Error(`Site with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return {
      message: `Site '${deleted.name}' deleted successfully`,
      deletedSite: {
        site_id: deleted.site_id,
        name: deleted.name
      }
    };
  }
}

export default new SiteService();
