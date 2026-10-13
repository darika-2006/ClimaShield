const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ WARNING: DATABASE_URL is missing in environment variables!');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('supabase')
    ? { rejectUnauthorized: false }
    : isProduction
    ? { rejectUnauthorized: false }
    : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('⚡ PostgreSQL / Supabase pool connection established');
  }
});

pool.on('error', (err) => {
  console.error('🔴 Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
