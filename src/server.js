const express = require('express');
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
});
