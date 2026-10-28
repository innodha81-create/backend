import jwt from 'jsonwebtoken';
import { pool } from '../../config/database.js';

const verifyTokenCore = async (token) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
  const decoded = jwt.verify(token, accessSecret);

  // Check token blocklist
  if (decoded.jti) {
    const blocklistCheck = await pool.query(
      'SELECT blocklist_id FROM token_blocklist WHERE token_jti = $1',
      [decoded.jti]
    );
    if (blocklistCheck.rows.length > 0) {
      const err = new Error('This token has been revoked / logged out');
      err.statusCode = 401;
      throw err;
    }
  }

  return decoded;
};

/**
 * Optional Auth: Attaches req.user if Bearer token is provided.
 * Does not block if no token is provided.
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const decoded = await verifyTokenCore(token);
    req.user = decoded;
    next();
  } catch {
    // If token was explicitly supplied but invalid/expired, still continue or attach null
    next();
  }
};

/**
 * Strict Auth: Requires a valid active Bearer token.
 */
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required. Format: Authorization: Bearer <token>'
    });
  }

  try {
    const decoded = await verifyTokenCore(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid or expired access token'
    });
  }
};
