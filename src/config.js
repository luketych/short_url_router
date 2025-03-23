require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  shortIo: {
    apiKey: process.env.SHORTIO_API_KEY,
    domain: process.env.SHORTIO_DOMAIN
  }
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'SHORTIO_API_KEY', 'SHORTIO_DOMAIN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

module.exports = config;
