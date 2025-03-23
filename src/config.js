require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  databaseUrl: process.env.DATABASE_URL,
  shortIo: {
    apiKey: process.env.SHORTIO_API_KEY,
    domain: process.env.SHORTIO_DOMAIN
  }
};

// Validate environment variables
const validateEnv = () => {
  const errors = [];
  const warnings = [];

  // Check required variables exist and are not empty
  const requiredEnvVars = ['DATABASE_URL', 'SHORTIO_API_KEY', 'SHORTIO_DOMAIN'];
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    } else if (process.env[envVar].trim() === '') {
      errors.push(`Required environment variable is empty: ${envVar}`);
    }
  });

  // Validate DATABASE_URL format
  if (process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
      warnings.push('DATABASE_URL does not appear to be a valid PostgreSQL connection string');
    }
  }

  // Validate SHORTIO_API_KEY format
  if (process.env.SHORTIO_API_KEY) {
    if (!process.env.SHORTIO_API_KEY.startsWith('sk_')) {
      warnings.push('SHORTIO_API_KEY does not appear to be valid (should start with "sk_")');
    }
  }

  // Validate SHORTIO_DOMAIN format
  if (process.env.SHORTIO_DOMAIN) {
    // Check if it's a valid hostname (no protocol, no path, no query params)
    const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!hostnameRegex.test(process.env.SHORTIO_DOMAIN)) {
      warnings.push('SHORTIO_DOMAIN does not appear to be a valid hostname (e.g., "example.com")');
    }
  }

  // Log all warnings
  warnings.forEach(warning => {
    console.warn(`⚠️  WARNING: ${warning}`);
  });

  // Throw error if there are any critical issues
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  return warnings.length === 0;
};

// Run validation
validateEnv();

module.exports = config;
