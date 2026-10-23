import jwt from 'jsonwebtoken';
import { pool } from '../../config/database.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required. Format: Authorization: Bearer <token>'
    });
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';

  try {
    const decoded = jwt.verify(token, accessSecret);

    // Check Token Blocklist in database
    if (decoded.jti) {
      const blocklistCheck = await pool.query(
        'SELECT blocklist_id FROM token_blocklist WHERE token_jti = $1',
        [decoded.jti]
      );

      if (blocklistCheck.rows.length > 0) {
        return res.status(401).json({
          success: false,
          error: 'This token has been revoked / logged out. Please sign in again.'
        });
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.name === 'TokenExpiredError' ? 'Access token has expired' : 'Invalid access token'
    });
  }
};
