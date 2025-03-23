const express = require('express');
const axios = require('axios');
const config = require('./config');
const db = require('./db');
const ShortIoProvider = require('./services/urlShortener/shortIoProvider');

const app = express();

// Parse JSON bodies first
app.use(express.json());

// Middleware for logging requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n=== Request: ${timestamp} ===`);
  console.log(`${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture response logging
  const originalSend = res.send;
  res.send = function (data) {
    console.log(`\n=== Response: ${timestamp} ===`);
    console.log('Status:', res.statusCode);
    console.log('Body:', typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Validate URL
function isValidUrl(url) {
  try {
    // Add http:// if protocol is missing
    if (!/^https?:\/\//i.test(url)) {
      url = 'http://' + url;
    }
    new URL(url);
    return url;
  } catch (e) {
    return false;
  }
}

// Initialize URL shortener service
const urlShortener = new ShortIoProvider(
  config.shortIo.apiKey,
  config.shortIo.domain
);

// Test Short.io credentials
async function testShortIoCredentials() {
  try {
    console.log('Testing Short.io API credentials...');
    
    // Validate API key format
    if (!config.shortIo.apiKey || !config.shortIo.apiKey.startsWith('sk_')) {
      console.error('❌ ERROR: Invalid Short.io API key format. API keys should start with "sk_"');
    }
    
    // Validate domain format
    const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!config.shortIo.domain || !hostnameRegex.test(config.shortIo.domain)) {
      console.error('❌ ERROR: Invalid Short.io domain format. Domain should be a valid hostname (e.g., "example.com")');
      console.error('   The error "body/domain must match format hostname" occurs when the domain is not properly formatted');
    }
    
    // Make a test request to the Short.io API
    await axios.get('https://api.short.io/api/links', {
      headers: {
        authorization: config.shortIo.apiKey
      }
    });
    
    console.log('✅ Short.io API credentials verified successfully');
  } catch (err) {
    console.error('❌ ERROR: Failed to connect to Short.io API');
    
    if (err.response) {
      if (err.response.status === 401) {
        console.error('   Authentication failed: Invalid API key');
      } else if (err.response.status === 403) {
        console.error('   Authorization failed: Insufficient permissions');
      } else {
        console.error(`   Status code: ${err.response.status}`);
        console.error(`   Error message: ${JSON.stringify(err.response.data)}`);
      }
    } else if (err.request) {
      console.error('   No response received from Short.io API. Check your internet connection.');
    } else {
      console.error(`   Error: ${err.message}`);
    }
    
    console.error('\nPlease check your .env file and ensure SHORTIO_API_KEY and SHORTIO_DOMAIN are correct.');
    console.error('You can find your API key in your Short.io dashboard at https://app.short.io/settings/developer');
  }
}

// GET /:shortCode - Get original URL
app.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;
    const originalUrl = await db.getUrlByShortCode(shortCode);

    if (!originalUrl) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.json({ url: originalUrl });
  } catch (err) {
    console.error('Error retrieving URL:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shorten - Create short URL
app.post('/api/shorten', async (req, res) => {
  try {
    console.log('Received shorten request:', req.body);
    const { url } = req.body;

    if (!url) {
      console.log('Error: No URL provided');
      return res.status(400).json({ error: 'URL is required' });
    }

    const validUrl = isValidUrl(url);
    if (!validUrl) {
      console.log('Error: Invalid URL format:', url);
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Create short URL using the provider
    const result = await urlShortener.shortenUrl(validUrl);
    console.log('Short URL created:', result);
    
    // Save to database
    const saved = await db.saveUrl(result.originalUrl, result.shortCode);
    
    if (!saved) {
      console.error('Failed to save URL to database');
      return res.status(500).json({ 
        error: 'Database Error',
        message: 'Failed to save URL mapping to database'
      });
    }

    res.status(201).json({
      originalUrl: result.originalUrl,
      shortCode: result.shortCode,
      shortUrl: `https://${config.shortIo.domain}/${result.shortCode}`
    });
  } catch (err) {
    console.error('Error in URL shortening:', {
      error: err.message,
      details: err.details || {},
      stack: err.stack
    });

    const statusCode = err.status || 500;
    const errorResponse = {
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { 
        details: err.details,
        stack: err.stack
      })
    };

    res.status(statusCode).json(errorResponse);
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('\n=== Unhandled Error ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Details:', err.details || {});
  
  const statusCode = err.status || 500;
  const errorResponse = {
    error: 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && {
      details: err.details,
      stack: err.stack
    })
  };

  res.status(statusCode).json(errorResponse);
});

// Start server
app.listen(config.port, () => {
  console.log('=================================');
  console.log(`Server running on port ${config.port}`);
  console.log('Available endpoints:');
  console.log(`- POST /api/shorten`);
  console.log(`- GET /:shortCode`);
  console.log(`- GET /health`);
  console.log('=================================');
  
  // Test Short.io credentials on startup
  testShortIoCredentials().catch(err => {
    console.error('Failed to test Short.io credentials:', err.message);
  });
});
