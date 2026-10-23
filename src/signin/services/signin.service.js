import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { pool } from '../../config/database.js';

class SigninService {
  getApiDirectory(baseUrl) {
    return {
      module: 'SignIn & Authentication API',
      description: 'Enterprise Dual-Token JWT Authentication with Device/IP Tracking and Token Blocklisting',
      totalEndpoints: 5,
      endpoints: [
        {
          method: 'GET',
          endpoint: `${baseUrl}`,
          description: 'Actuator-like API discovery directory (Lists all sign-in APIs)'
        },
        {
          method: 'POST',
          endpoint: `${baseUrl}`,
          description: 'SignIn / Login with Email or Username + Password (Generates Dual Tokens & logs Device/IP)',
          bodyExample: {
            loginIdentifier: 'admin@company.com or superadmin',
            password: 'yourPassword123'
          }
        },
        {
          method: 'POST',
          endpoint: `${baseUrl}/signout`,
          description: 'SignOut / Logout (Blocklists Access Token & removes active Session)',
          headers: { Authorization: 'Bearer <accessToken>' }
        },
        {
          method: 'POST',
          endpoint: `${baseUrl}/refresh`,
          description: 'Exchange valid Refresh Token for a new short-lived Access Token',
          bodyExample: { refreshToken: '<refreshToken>' }
        },
        {
          method: 'GET',
          endpoint: `${baseUrl}/me`,
          description: 'Fetch current logged-in user profile, role, and active session details',
          headers: { Authorization: 'Bearer <accessToken>' }
        }
      ]
    };
  }

  async signIn({ loginIdentifier, password, ipAddress, userAgent }) {
    if (!loginIdentifier || !password || typeof loginIdentifier !== 'string' || typeof password !== 'string') {
      const error = new Error('Invalid Credentials');
      error.statusCode = 401;
      throw error;
    }

    const trimmedIdentifier = loginIdentifier.trim().toLowerCase();
    if (!trimmedIdentifier) {
      const error = new Error('Invalid Credentials');
      error.statusCode = 401;
      throw error;
    }

    // 1. Parameterized query checking either email OR username
    const userResult = await pool.query(
      `SELECT u.user_id, u.employee_code, u.signin_role_id, u.username, u.email,
              u.password_hash, u.is_active, r.signin_role_name
       FROM users u
       JOIN signin_roles r ON u.signin_role_id = r.signin_role_id
       WHERE LOWER(u.email) = $1 OR LOWER(u.username) = $1`,
      [trimmedIdentifier]
    );

    if (userResult.rows.length === 0) {
      const error = new Error('Invalid Credentials');
      error.statusCode = 401;
      throw error;
    }

    const user = userResult.rows[0];

    // Check account status
    if (!user.is_active) {
      const error = new Error('Your account is deactivated. Please contact administrator.');
      error.statusCode = 403;
      throw error;
    }

    // 2. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('Invalid Credentials');
      error.statusCode = 401;
      throw error;
    }

    // 3. Dual-Token Generation
    const accessSecret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    const accessJti = crypto.randomUUID();
    const refreshJti = crypto.randomUUID();

    const accessToken = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        roleId: user.signin_role_id,
        roleName: user.signin_role_name,
        jti: accessJti
      },
      accessSecret,
      { expiresIn: accessExpiresIn }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.user_id,
        jti: refreshJti
      },
      refreshSecret,
      { expiresIn: refreshExpiresIn }
    );

    // 4. Calculate refresh token expiration (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 5. Store Session in user_sessions table
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      `INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.user_id, refreshTokenHash, ipAddress || null, userAgent || null, expiresAt]
    );

    return {
      user: {
        userId: user.user_id,
        employeeCode: user.employee_code,
        username: user.username,
        email: user.email,
        signinRoleId: user.signin_role_id,
        roleName: user.signin_role_name
      },
      tokens: {
        tokenType: 'Bearer',
        accessToken,
        refreshToken,
        expiresIn: accessExpiresIn
      },
      device: {
        ipAddress: ipAddress || 'Unknown',
        userAgent: userAgent || 'Unknown'
      }
    };
  }

  async signOut({ accessJti, accessTokenExpiry, refreshToken, userId }) {
    if (accessJti) {
      const expDate = accessTokenExpiry ? new Date(accessTokenExpiry * 1000) : new Date(Date.now() + 15 * 60 * 1000);
      await pool.query(
        `INSERT INTO token_blocklist (token_jti, user_id, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (token_jti) DO NOTHING`,
        [accessJti, userId || null, expDate]
      );
    }

    if (refreshToken) {
      const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await pool.query('DELETE FROM user_sessions WHERE refresh_token_hash = $1', [refreshTokenHash]);
    }

    return {
      message: 'Successfully signed out. Token revoked and session invalidated.'
    };
  }

  async refreshAccessToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('refreshToken is required');
      error.statusCode = 400;
      throw error;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, refreshSecret);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token');
      error.statusCode = 401;
      throw error;
    }

    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const sessionResult = await pool.query(
      `SELECT s.session_id, s.user_id, s.expires_at, u.username, u.email, u.signin_role_id, u.employee_code, u.is_active, r.signin_role_name
       FROM user_sessions s
       JOIN users u ON s.user_id = u.user_id
       JOIN signin_roles r ON u.signin_role_id = r.signin_role_id
       WHERE s.refresh_token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP`,
      [refreshTokenHash]
    );

    if (sessionResult.rows.length === 0) {
      const error = new Error('Session has expired or was revoked. Please sign in again.');
      error.statusCode = 401;
      throw error;
    }

    const user = sessionResult.rows[0];
    if (!user.is_active) {
      const error = new Error('User account is deactivated');
      error.statusCode = 403;
      throw error;
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const newAccessJti = crypto.randomUUID();

    const newAccessToken = jwt.sign(
      {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        roleId: user.signin_role_id,
        roleName: user.signin_role_name,
        jti: newAccessJti
      },
      accessSecret,
      { expiresIn: accessExpiresIn }
    );

    return {
      tokenType: 'Bearer',
      accessToken: newAccessToken,
      expiresIn: accessExpiresIn
    };
  }

  async getMe(userId) {
    const result = await pool.query(
      `SELECT u.user_id, u.employee_code, u.username, u.email, u.is_active, u.created_at, u.updated_at,
              r.signin_role_id, r.signin_role_name,
              c.username as created_by_username,
              up.username as updated_by_username
       FROM users u
       JOIN signin_roles r ON u.signin_role_id = r.signin_role_id
       LEFT JOIN users c ON u.created_by = c.user_id
       LEFT JOIN users up ON u.updated_by = up.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const u = result.rows[0];

    const sessionCount = await pool.query(
      'SELECT COUNT(*) as active_sessions FROM user_sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP',
      [userId]
    );

    return {
      userId: u.user_id,
      employeeCode: u.employee_code,
      username: u.username,
      email: u.email,
      role: {
        roleId: u.signin_role_id,
        roleName: u.signin_role_name
      },
      isActive: u.is_active,
      audit: {
        createdBy: u.created_by_username || null,
        createdAt: u.created_at,
        updatedBy: u.updated_by_username || null,
        updatedAt: u.updated_at
      },
      activeSessions: parseInt(sessionCount.rows[0].active_sessions, 10)
    };
  }
}

export default new SigninService();
