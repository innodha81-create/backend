const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SORT_COLUMNS = ['created_at', 'name', 'username', 'email', 'employer', 'is_active'];

/**
 * Validates UUID format for URL parameter :id
 */
export const validateUserId = (req, res, next) => {
  const { id } = req.params;
  if (!id || !UUID_REGEX.test(id)) {
    return res.status(400).json({
      success: false,
      error: `Invalid user ID format '${id}'. Must be a valid UUID.`
    });
  }
  next();
};

/**
 * Validates request payload for creating a new User
 */
export const validateCreateUser = (req, res, next) => {
  const { name, email, role, employer, username, password, employee_code } = req.body || {};

  const nameVal = (name || '').trim();
  const emailVal = (email || '').trim().toLowerCase();
  const employerVal = (employer || '').trim();
  const roleVal = (role || '').trim();
  const rawUsername = (username || emailVal.split('@')[0] || '').trim();
  const passwordVal = (password || 'Password@123').trim();
  const employeeCodeVal = employee_code ? employee_code.trim() : null;

  const errors = [];

  if (!nameVal) {
    errors.push("Field 'name' is required (min 2 characters)");
  } else if (nameVal.length < 2 || nameVal.length > 255) {
    errors.push("Field 'name' must be between 2 and 255 characters");
  }

  if (!emailVal) {
    errors.push("Field 'email' is required");
  } else if (!EMAIL_REGEX.test(emailVal)) {
    errors.push("Field 'email' must be a valid email address");
  }

  if (!employerVal) {
    errors.push("Field 'employer' is required (e.g. internal or company name)");
  } else if (employerVal.length < 2 || employerVal.length > 255) {
    errors.push("Field 'employer' must be between 2 and 255 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors
    });
  }

  req.sanitizedBody = {
    name: nameVal,
    email: emailVal,
    employer: employerVal,
    role: roleVal || null,
    username: rawUsername,
    password: passwordVal,
    employee_code: employeeCodeVal
  };

  next();
};

/**
 * Validates request payload for updating a User
 */
export const validateUpdateUser = (req, res, next) => {
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

  if (body.email !== undefined) {
    const trimmed = body.email.trim().toLowerCase();
    if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
      errors.push("Field 'email' must be a valid email address");
    }
  }

  if (body.employer !== undefined) {
    const trimmed = body.employer.trim();
    if (!trimmed || trimmed.length < 2 || trimmed.length > 255) {
      errors.push("Field 'employer' must be between 2 and 255 characters");
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
 * Validates pagination, sorting & query parameters
 */
export const validatePaginationQuery = (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const rawSortBy = (req.query.sortBy || 'created_at').trim();
  const rawSortOrder = (req.query.sortOrder || 'DESC').toUpperCase();

  if (page < 1) {
    return res.status(400).json({ success: false, error: "Query parameter 'page' must be a positive integer" });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({ success: false, error: "Query parameter 'limit' must be between 1 and 100" });
  }

  const sortBy = ALLOWED_SORT_COLUMNS.includes(rawSortBy) ? rawSortBy : 'created_at';
  const sortOrder = ['ASC', 'DESC'].includes(rawSortOrder) ? rawSortOrder : 'DESC';

  req.pagination = {
    page,
    limit,
    search: req.query.search ? req.query.search.trim() : null,
    employer: req.query.employer ? req.query.employer.trim() : null,
    role: req.query.role ? req.query.role.trim() : null,
    sortBy,
    sortOrder
  };

  next();
};

