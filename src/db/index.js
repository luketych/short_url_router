const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for Neon.tech
      }
    });
  }

  async query(text, params) {
    return this.pool.query(text, params);
  }

  async getUrlByShortCode(shortCode) {
    try {
      const result = await this.query(
        'SELECT original_url FROM shortened_urls WHERE short_code = $1',
        [shortCode]
      );
      return result.rows[0]?.original_url || null;
    } catch (err) {
      console.error('Database error:', err);
      return null;
    }
  }

  async saveUrl(originalUrl, shortCode) {
    try {
      await this.query(
        `INSERT INTO shortened_urls (original_url, short_code)
         VALUES ($1, $2)
         ON CONFLICT (short_code) 
         DO UPDATE SET 
           original_url = EXCLUDED.original_url,
           updated_at = CURRENT_TIMESTAMP`,
        [originalUrl, shortCode]
      );
      return true;
    } catch (err) {
      console.error('Database error:', err);
      return false;
    }
  }
}

// Singleton instance
const db = new Database();
module.exports = db;
