import projectRepository from '../repositories/project.repository.js';
import {
  CreateProjectDTO,
  UpdateProjectDTO,
  ProjectResponseDTO,
  ProjectStatsDTO
} from '../dtos/index.js';

const ALLOWED_RISK_LEVELS = ['easy', 'medium', 'high'];

/**
 * Project Service (Business Logic Layer)
 * Coordinates repository operations, validates domain rules, and formats data using DTOs.
 */
class ProjectService {
  /**
   * Self-documenting API discovery directory (Actuator-style)
   */
  getApiDirectory(baseUrl) {
    return {
      module: 'Project Management API',
      version: '2.0.0 (5-Layer Clean Architecture)',
      architecture: 'Routes -> Middlewares -> Controllers -> DTOs -> Services -> Repositories -> Database',
      totalEndpoints: 7,
      fields: {
        project_id: 'UUID (Primary Key, Auto-generated)',
        project_name: 'String (Required, 2-255 chars)',
        project_code: 'String (Required, Unique, 2-100 chars, e.g. PRJ-2026-001)',
        client: 'String (Required, 2-255 chars)',
        risk_level: "Enum ['easy', 'medium', 'high'] (Required)",
        description: 'Text (Optional)',
        status: 'String (Default: active)',
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
          description: 'Project Analytics Summary (Total projects, count breakdown by risk level easy/medium/high)'
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/list`,
          description: 'Fetch projects with pagination, full-text search, and risk-level filter',
          queryParams: {
            page: 'Page number (default: 1)',
            limit: 'Items per page (default: 10, max: 100)',
            search: 'Search text across project_name, project_code, and client (ILIKE query)',
            risk_level: "Filter by risk level ('easy' | 'medium' | 'high')",
            sortBy: "Sort column ('created_at' | 'project_name' | 'project_code' | 'risk_level')",
            sortOrder: "Sort direction ('ASC' | 'DESC', default: 'DESC')"
          },
          exampleUrl: `${baseUrl}/list?page=1&limit=10&risk_level=medium&search=metro&sortBy=created_at&sortOrder=DESC`
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/:id`,
          description: 'Fetch a single Project by UUID'
        },
        {
          method: 'POST',
          endpoint: `${baseUrl}`,
          description: 'Create a new Project (Requires project_name, project_code, client, risk_level)',
          bodyExample: {
            project_name: 'Metro Line Safety Audit',
            project_code: 'PRJ-2026-001',
            client: 'Metro Rail Corporation',
            risk_level: 'medium',
            description: 'Comprehensive safety and risk evaluation project'
          }
        },
        {
          method: 'PUT',
          endpoint: `${baseUrl}/:id`,
          description: 'Update an existing Project by UUID',
          bodyExample: {
            project_name: 'Metro Line Safety Audit Phase 2',
            client: 'Metro Rail Corporation',
            risk_level: 'high',
            description: 'Updated scope'
          }
        },
        {
          method: 'DELETE',
          endpoint: `${baseUrl}/:id`,
          description: 'Permanently remove a Project by UUID'
        }
      ]
    };
  }

  /**
   * Get project analytics and stats
   */
  async getProjectStats() {
    const { total, breakdown } = await projectRepository.getRiskAnalytics();
    return new ProjectStatsDTO({ total, breakdown });
  }

  /**
   * Fetch paginated list of projects with search and filters
   */
  async getAllProjects(pagination = {}) {
    const {
      page = 1,
      limit = 10,
      offset = 0,
      search = null,
      risk_level = null,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = pagination;

    const whereClauses = [];
    const values = [];

    // Filter by search keyword
    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;
      whereClauses.push(
        `(project_name ILIKE $${idx} OR project_code ILIKE $${idx} OR client ILIKE $${idx})`
      );
    }

    // Filter by risk level
    if (risk_level) {
      values.push(risk_level.toLowerCase());
      const idx = values.length;
      whereClauses.push(`LOWER(risk_level) = $${idx}`);
    }

    // 1. Get total count
    const total = await projectRepository.count({ whereClauses, values });

    // 2. Get records from repository
    const rawProjects = await projectRepository.findPaginated({
      whereClauses,
      values,
      limit,
      offset,
      sortBy,
      sortOrder
    });

    const totalPages = Math.ceil(total / limit) || 1;

    // 3. Map entities through Response DTO
    const projects = ProjectResponseDTO.fromEntities(rawProjects);

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
        risk_level,
        sortBy,
        sortOrder
      },
      projects
    };
  }

  /**
   * Fetch single project by ID
   */
  async getProjectById(id) {
    const rawProject = await projectRepository.findById(id);
    if (!rawProject) {
      const error = new Error(`Project with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return ProjectResponseDTO.fromEntity(rawProject);
  }

  /**
   * Create a new project
   */
  async createProject(rawData, userId = null) {
    const dto = new CreateProjectDTO(rawData);

    // Domain validation
    if (!dto.projectName) {
      const error = new Error('project_name is required');
      error.statusCode = 400;
      throw error;
    }

    if (!dto.projectCode) {
      const error = new Error('project_code is required');
      error.statusCode = 400;
      throw error;
    }

    if (!dto.client) {
      const error = new Error('client is required');
      error.statusCode = 400;
      throw error;
    }

    if (!dto.riskLevel || !ALLOWED_RISK_LEVELS.includes(dto.riskLevel)) {
      const error = new Error(`Invalid risk_level '${dto.riskLevel}'. Allowed values are: 'easy', 'medium', 'high'`);
      error.statusCode = 400;
      throw error;
    }

    // Unique project_code check
    const existing = await projectRepository.findByCode(dto.projectCode);
    if (existing) {
      const error = new Error(`Project with code '${dto.projectCode}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const created = await projectRepository.create({
      projectName: dto.projectName,
      projectCode: dto.projectCode,
      client: dto.client,
      riskLevel: dto.riskLevel,
      description: dto.description,
      userId
    });

    return ProjectResponseDTO.fromEntity(created);
  }

  /**
   * Update an existing project
   */
  async updateProject(id, rawData) {
    const existing = await projectRepository.findById(id);
    if (!existing) {
      const error = new Error(`Project with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const dto = new UpdateProjectDTO(rawData);

    const projectName = dto.projectName !== undefined ? dto.projectName : existing.project_name;
    const projectCode = dto.projectCode !== undefined ? dto.projectCode : existing.project_code;
    const client = dto.client !== undefined ? dto.client : existing.client;
    const description = dto.description !== undefined ? dto.description : existing.description;

    let riskLevel = existing.risk_level;
    if (dto.riskLevel !== undefined) {
      if (!ALLOWED_RISK_LEVELS.includes(dto.riskLevel)) {
        const error = new Error(`Invalid risk_level '${dto.riskLevel}'. Allowed values are: 'easy', 'medium', 'high'`);
        error.statusCode = 400;
        throw error;
      }
      riskLevel = dto.riskLevel;
    }

    if (!projectName) {
      const error = new Error('project_name cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (!projectCode) {
      const error = new Error('project_code cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    // Unique project_code duplicate check excluding this ID
    const duplicate = await projectRepository.findDuplicateCode(projectCode, id);
    if (duplicate) {
      const error = new Error(`Project with code '${projectCode}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    const updated = await projectRepository.update(id, {
      projectName,
      projectCode,
      client,
      riskLevel,
      description
    });

    return ProjectResponseDTO.fromEntity(updated);
  }

  /**
   * Delete a project
   */
  async deleteProject(id) {
    const deleted = await projectRepository.delete(id);
    if (!deleted) {
      const error = new Error(`Project with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return {
      message: `Project '${deleted.project_name}' deleted successfully`,
      deletedProject: {
        project_id: deleted.project_id,
        project_name: deleted.project_name
      }
    };
  }
}

export default new ProjectService();
