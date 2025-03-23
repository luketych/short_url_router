const express = require('express');
const config = require('./config');
const db = require('./db');
const ShortIoProvider = require('./services/urlShortener/shortIoProvider');

const app = express();

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Parse JSON bodies
app.use(express.json());

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

// POST /shorten - Create short URL
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
      return res.status(500).json({ error: 'Failed to save URL' });
    }

    res.json({
      originalUrl: result.originalUrl,
      shortCode: result.shortCode,
      shortUrl: `https://${config.shortIo.domain}/${result.shortCode}`
    });
  } catch (err) {
    console.error('Error creating short URL:', err);
    res.status(500).json({ error: 'Failed to create short URL' });
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
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
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
