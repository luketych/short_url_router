const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Read schema file
    const schema = fs.readFileSync(
      path.join(__dirname, '../../schema.sql'),
      'utf8'
    );

    // Execute schema
    await pool.query(schema);
    console.log('✅ Database schema initialized successfully');
  } catch (err) {
    console.error('❌ Error initializing database schema:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  initDatabase().catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
}

module.exports = initDatabase;
