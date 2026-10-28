const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_SORT_COLUMNS = ['created_at', 'name', 'description'];

/**
 * Validates UUID format for URL parameter :id
 */
export const validateSiteId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid site ID format '${id}'. Must be a valid UUID.`
    });
  }
  next();
};

/**
 * Validates request payload for creating a new Site
 */
export const validateCreateSite = (req, res, next) => {
  const { name, description } = req.body || {};

  const nameVal = (name || '').trim();
  const descriptionVal = (description || '').trim();

  const errors = [];

  if (!nameVal) {
    errors.push("Field 'name' is required (min 2 characters)");
  } else if (nameVal.length < 2 || nameVal.length > 255) {
    errors.push("Field 'name' must be between 2 and 255 characters");
  }

  if (!descriptionVal) {
    errors.push("Field 'description' is required (min 2 characters)");
  } else if (descriptionVal.length < 2 || descriptionVal.length > 1000) {
    errors.push("Field 'description' must be between 2 and 1000 characters");
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
    name: nameVal,
    description: descriptionVal
  };

  next();
};

/**
 * Validates request payload for updating an existing Site
 */
export const validateUpdateSite = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (Object.keys(body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Request body cannot be empty for update'
    });
  }

  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 255) {
      errors.push("Field 'name' must be between 2 and 255 characters");
    }
  }

  if (body.description !== undefined) {
    const trimmed = body.description.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 1000) {
      errors.push("Field 'description' must be between 2 and 1000 characters");
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
  let { page = 1, limit = 10, search, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

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

  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit,
    search: search ? search.trim() : null,
    sortBy: validSortBy,
    sortOrder: validSortOrder
  };

  next();
};
