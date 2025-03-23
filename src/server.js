const express = require('express');
const config = require('./config');
const db = require('./db');
const ShortIoProvider = require('./services/urlShortener/shortIoProvider');

const app = express();
app.use(express.json());

// Initialize URL shortener service
const urlShortener = new ShortIoProvider(
  config.shortIo.apiKey,
  config.shortIo.domain
);

// GET /:shortCode - Redirect to original URL
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
app.post('/shorten', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Create short URL using the provider
    const result = await urlShortener.shortenUrl(url);
    
    // Save to database
    const saved = await db.saveUrl(result.originalUrl, result.shortCode);
    
    if (!saved) {
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

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
