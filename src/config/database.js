import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export const initDatabase = async () => {
  try {
    // 1. Signin Roles Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS signin_roles (
        signin_role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        signin_role_name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_code VARCHAR(50) UNIQUE,
        signin_role_id UUID NOT NULL REFERENCES signin_roles(signin_role_id) ON DELETE RESTRICT,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. User Sessions Table (Refresh token & Device tracking)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        refresh_token_hash TEXT NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Token Blocklist Table (Revoked tokens on logout)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS token_blocklist (
        blocklist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_jti VARCHAR(255) NOT NULL UNIQUE,
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Database init error:', error.message);
  }
};

export const checkDatabaseHealth = async () => {
  const startTime = Date.now();
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as now');
      return {
        status: 'UP',
        type: 'PostgreSQL (Supabase)',
        latencyMs: Date.now() - startTime,
        serverTime: result.rows[0].now
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return {
      status: 'DOWN',
      type: 'PostgreSQL (Supabase)',
      latencyMs: Date.now() - startTime,
      error: error.message
    };
  }
};
