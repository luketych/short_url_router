const axios = require('axios');
const UrlShortenerInterface = require('./interface');

class ShortIoProvider extends UrlShortenerInterface {
  constructor(apiKey, domain) {
    super();
    this.apiKey = apiKey;
    this.domain = domain;
  }

  /**
   * Creates a short URL using Short.io API
   * @param {string} longUrl - The original URL to be shortened
   * @returns {Promise<{shortCode: string, originalUrl: string}>}
   */
  async shortenUrl(longUrl) {
    try {
      // Validate domain format before making the request
      const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!this.domain || !hostnameRegex.test(this.domain)) {
        const error = new Error(`Invalid domain format: "${this.domain}". Domain should be a valid hostname (e.g., "example.com") without http:// or paths.`);
        error.status = 400;
        error.details = {
          error: 'Invalid domain format',
          domain: this.domain,
          expectedFormat: 'hostname (e.g., example.com)'
        };
        throw error;
      }

      // Validate API key format
      if (!this.apiKey || !this.apiKey.startsWith('sk_')) {
        const error = new Error(`Invalid API key format. API keys should start with "sk_".`);
        error.status = 401;
        error.details = {
          error: 'Invalid API key format'
        };
        throw error;
      }

      const response = await axios.post(
        'https://api.short.io/links',
        {
          originalURL: longUrl,
          domain: this.domain,
        },
        {
          headers: {
            authorization: this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      // Extract the code from the shortURL
      const shortUrl = new URL(response.data.shortURL);
      const shortCode = shortUrl.pathname.slice(1); // Remove leading slash

      return {
        shortCode,
        originalUrl: longUrl
      };
    } catch (err) {
      // If it's our own validation error, just rethrow it
      if (err.status === 400 || err.status === 401) {
        throw err;
      }

      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      let userMessage = 'Failed to create short URL';
      
      if (err.response?.status === 400) {
        // Handle specific domain format errors from the API
        if (errorMessage.includes('body/domain must match format "hostname"')) {
          userMessage = `Invalid domain format: "${this.domain}". Domain should be a valid hostname (e.g., "example.com") without http:// or paths.`;
        } else {
          userMessage = 'Invalid URL or domain configuration';
        }
      } else if (err.response?.status === 401) {
        userMessage = 'Invalid API key. Check your SHORTIO_API_KEY in .env file.';
      } else if (err.response?.status === 429) {
        userMessage = 'Rate limit exceeded';
      }

      const error = new Error(`${userMessage}: ${errorMessage}`);
      error.status = err.response?.status || 500;
      error.details = err.response?.data;
      throw error;
    }
  }

  /**
   * Gets the original URL from Short.io API
   * Note: We don't actually use this since we store URLs in our database
   * This is here for completeness of the interface implementation
   * @param {string} shortCode - The code part of the shortened URL
   * @returns {Promise<string|null>} The original URL or null if not found
   */
  async getOriginalUrl(shortCode) {
    try {
      // Validate API key format
      if (!this.apiKey || !this.apiKey.startsWith('sk_')) {
        const error = new Error(`Invalid API key format. API keys should start with "sk_".`);
        error.status = 401;
        error.details = {
          error: 'Invalid API key format'
        };
        throw error;
      }

      const response = await axios.get(
        `https://api.short.io/links/expand/${shortCode}`,
        {
          headers: {
            authorization: this.apiKey,
          },
        }
      );
      return response.data.originalURL;
    } catch (err) {
      // If it's our own validation error, just rethrow it
      if (err.status === 401) {
        throw err;
      }

      if (err.response?.status === 404) {
        return null;
      }

      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      let userMessage = 'Failed to get original URL';
      
      if (err.response?.status === 401) {
        userMessage = 'Invalid API key. Check your SHORTIO_API_KEY in .env file.';
      } else if (err.response?.status === 429) {
        userMessage = 'Rate limit exceeded';
      }

      throw new Error(`${userMessage}: ${errorMessage}`);
    }
  }
}

module.exports = ShortIoProvider;
