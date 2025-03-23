'use strict';

require('dotenv/config');
const axios = require('axios');
const path = require('path');

const SHORT_IO_API_KEY = process.env.SHORTIO_API_KEY;
const SHORT_IO_DOMAIN = process.env.SHORTIO_DOMAIN;

console.log('📦 Short.io domain from env:', SHORT_IO_DOMAIN);

async function createShortLink(originalURL) {
  try {
    console.log('CDN_BASE_URL:', process.env.CDN_BASE_URL);
    console.log('fileUrl:', originalURL);
    console.log('🔗 Full URL to shorten:', originalURL);
    
    const response = await axios.post(
      'https://api.short.io/links',
      {
        originalURL,
        domain: SHORT_IO_DOMAIN,
      },
      {
        headers: {
          authorization: SHORT_IO_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Short link created:', response.data.shortURL);
    return response.data;
  } catch (err) {
    console.error('❌ Error creating short link:', err.response?.data || err.message);
    return null;
  }
}

// Function to check if a file is being run directly
function isMainModule() {
  return require.main === module;
}

// Optional: CLI usage
if (isMainModule()) {
  const longUrl = process.argv[2];
  if (!longUrl) {
    console.error('⚠️  Usage: node shortio_script.js <long-url>');
    process.exit(1);
  }
  createShortLink(longUrl);
}

module.exports = {
  createShortLink
};
