import bcrypt from 'bcryptjs';
import userRepository from '../repositories/user.repository.js';

class UserService {
  getApiDirectory(baseUrl) {
    return {
      module: 'Users Management API',
      description: 'Endpoints for managing users with name, email, role, and employer',
      totalEndpoints: 6,
      endpoints: [
        { method: 'GET', endpoint: `${baseUrl}`, description: 'Actuator-like API discovery directory' },
        { method: 'GET', endpoint: `${baseUrl}/stats`, description: 'Users statistics and summary counts' },
        { method: 'GET', endpoint: `${baseUrl}/list`, description: 'Read all users with pagination, search, and filtering' },
        { method: 'GET', endpoint: `${baseUrl}/:id`, description: 'Read single user by UUID' },
        { method: 'POST', endpoint: `${baseUrl}`, description: 'Create a new user' },
        { method: 'PUT', endpoint: `${baseUrl}/:id`, description: 'Update an existing user' },
        { method: 'DELETE', endpoint: `${baseUrl}/:id`, description: 'Delete a user by UUID' }
      ]
    };
  }

  async getAllUsers(params) {
    const { page = 1, limit = 10, search, employer, role, sortBy = 'created_at', sortOrder = 'DESC' } = params;
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      const idx = values.length;
      whereClauses.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR u.username ILIKE $${idx} OR u.employer ILIKE $${idx})`);
    }

    if (employer) {
      values.push(`%${employer}%`);
      const idx = values.length;
      whereClauses.push(`u.employer ILIKE $${idx}`);
    }

    if (role) {
      values.push(`%${role}%`);
      const idx = values.length;
      whereClauses.push(`r.signin_role_name ILIKE $${idx}`);
    }

    const sortColumnMap = {
      created_at: 'u.created_at',
      name: 'u.name',
      username: 'u.username',
      email: 'u.email',
      employer: 'u.employer',
      is_active: 'u.is_active'
    };
    const dbSortCol = sortColumnMap[sortBy] || 'u.created_at';

    const [users, total] = await Promise.all([
      userRepository.findPaginated({
        whereClauses,
        values,
        limit,
        offset,
        sortBy: dbSortCol,
        sortOrder
      }),
      userRepository.count({ whereClauses, values })
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`User with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async createUser(payload) {
    const { name, email, employer, role, username, password, employee_code } = payload;

    // Check duplicate email
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      const error = new Error(`User with email '${email}' already exists`);
      error.statusCode = 409;
      throw error;
    }

    // Resolve Role
    let roleRecord = null;
    if (role) {
      roleRecord = await userRepository.findRole(role);
      if (!roleRecord) {
        const error = new Error(`Role '${role}' not found. Please specify a valid role (e.g. User, Superadmin).`);
        error.statusCode = 400;
        throw error;
      }
    } else {
      roleRecord = await userRepository.getDefaultRole();
    }

    // Check / Generate unique username
    let finalUsername = username;
    const existingUser = await userRepository.findByUsername(finalUsername);
    if (existingUser) {
      finalUsername = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const created = await userRepository.create({
      name,
      username: finalUsername,
      email,
      employer,
      employee_code,
      signin_role_id: roleRecord.signin_role_id,
      password_hash,
      is_active: true
    });

    return {
      ...created,
      role: roleRecord.signin_role_name,
      role_id: roleRecord.signin_role_id
    };
  }

  async updateUser(id, payload) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      const error = new Error(`User with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const updates = {};

    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.employer !== undefined) updates.employer = payload.employer.trim();
    if (payload.employee_code !== undefined) updates.employee_code = payload.employee_code;
    if (payload.is_active !== undefined) updates.is_active = Boolean(payload.is_active);

    if (payload.email !== undefined) {
      const cleanEmail = payload.email.trim().toLowerCase();
      const duplicateEmail = await userRepository.findByEmail(cleanEmail, id);
      if (duplicateEmail) {
        const error = new Error(`User with email '${cleanEmail}' already exists`);
        error.statusCode = 409;
        throw error;
      }
      updates.email = cleanEmail;
    }

    if (payload.role !== undefined) {
      const roleRecord = await userRepository.findRole(payload.role.trim());
      if (!roleRecord) {
        const error = new Error(`Role '${payload.role}' not found`);
        error.statusCode = 400;
        throw error;
      }
      updates.signin_role_id = roleRecord.signin_role_id;
    }

    if (payload.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password_hash = await bcrypt.hash(payload.password.trim(), salt);
    }

    await userRepository.update(id, updates);
    return await userRepository.findById(id);
  }

  async deleteUser(id) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      const error = new Error(`User with ID '${id}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const deleted = await userRepository.delete(id);
    return deleted;
  }

  async getUserStats() {
    return await userRepository.getStats();
  }
}

export default new UserService();

