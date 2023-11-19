export const ORDERS_CLEANUP_INTERVAL_SECS = process.env.ORDERS_CLEANUP_INTERVAL_SECS || 60 * 15;

export const REFRESH_TOKENS_INTERVAL_SECS = process.env.REFRESH_TOKENS_INTERVAL_SECS || 60 * 30;

export const SQLITE_DATABASE_PATH = process.env.SQLITE_DATABASE_PATH || 'database.db';

export const GAS_DB_ENDPOINT = process.env.GAS_DB_ENDPOINT;
