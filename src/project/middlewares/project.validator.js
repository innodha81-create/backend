const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_RISK_LEVELS = ['easy', 'medium', 'high'];
const ALLOWED_SORT_COLUMNS = ['created_at', 'project_name', 'project_code', 'client', 'risk_level', 'status'];

/**
 * Validates UUID format for URL parameter :id
 */
export const validateProjectId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid project ID format '${id}'. Must be a valid UUID.`
    });
  }
  next();
};

/**
 * Validates request payload for creating a new Project
 */
export const validateCreateProject = (req, res, next) => {
  const { project_name, projectName, project_code, projectCode, client, clientName, client_name, risk_level, riskLevel } = req.body || {};

  const name = (project_name || projectName || '').trim();
  const code = (project_code || projectCode || '').trim();
  const clientVal = (client || clientName || client_name || '').trim();
  const rawRisk = (risk_level || riskLevel || '').trim().toLowerCase();

  const errors = [];

  if (!name) {
    errors.push("Field 'project_name' is required (min 2 characters)");
  } else if (name.length < 2 || name.length > 255) {
    errors.push("Field 'project_name' must be between 2 and 255 characters");
  }

  if (!code) {
    errors.push("Field 'project_code' is required (e.g. 'PRJ-2026-001')");
  } else if (code.length < 2 || code.length > 100) {
    errors.push("Field 'project_code' must be between 2 and 100 characters");
  }

  if (!clientVal) {
    errors.push("Field 'client' is required");
  } else if (clientVal.length < 2 || clientVal.length > 255) {
    errors.push("Field 'client' must be between 2 and 255 characters");
  }

  if (!rawRisk) {
    errors.push("Field 'risk_level' is required. Allowed values: 'easy', 'medium', 'high'");
  } else if (!ALLOWED_RISK_LEVELS.includes(rawRisk)) {
    errors.push(`Invalid risk_level '${rawRisk}'. Allowed values are: 'easy', 'medium', 'high'`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  // Normalized sanitized body fields
  req.sanitizedBody = {
    ...req.body,
    project_name: name,
    project_code: code,
    client: clientVal,
    risk_level: rawRisk,
    description: req.body.description ? req.body.description.trim() : null
  };

  next();
};

/**
 * Validates request payload for updating an existing Project
 */
export const validateUpdateProject = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Request body cannot be empty for update'
    });
  }

  const name = body.project_name || body.projectName;
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 255) {
      errors.push("Field 'project_name' must be between 2 and 255 characters");
    }
  }

  const code = body.project_code || body.projectCode;
  if (code !== undefined) {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 100) {
      errors.push("Field 'project_code' must be between 2 and 100 characters");
    }
  }

  const clientVal = body.client || body.clientName || body.client_name;
  if (clientVal !== undefined) {
    const trimmed = clientVal.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 255) {
      errors.push("Field 'client' must be between 2 and 255 characters");
    }
  }

  const rawRisk = body.risk_level || body.riskLevel;
  if (rawRisk !== undefined) {
    const trimmed = rawRisk.trim().toLowerCase();
    if (!ALLOWED_RISK_LEVELS.includes(trimmed)) {
      errors.push(`Invalid risk_level '${trimmed}'. Allowed values are: 'easy', 'medium', 'high'`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

/**
 * Validates and sanitizes pagination and filtering query parameters
 */
export const validatePaginationQuery = (req, res, next) => {
  let { page = 1, limit = 10, risk_level, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100; // Cap limit for performance

  // Validate sortBy against whitelist to prevent SQL injection
  const sortCol = sortBy.toLowerCase();
  const validSortBy = ALLOWED_SORT_COLUMNS.includes(sortCol) ? sortCol : 'created_at';

  // Validate sortOrder
  const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Validate risk_level filter if passed
  let validRisk = null;
  if (risk_level) {
    const r = risk_level.toLowerCase().trim();
    if (ALLOWED_RISK_LEVELS.includes(r)) {
      validRisk = r;
    }
  }

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
    search: search ? search.trim() : null,
    risk_level: validRisk,
    sortBy: validSortBy,
    sortOrder: validSortOrder
  };

  next();
};
