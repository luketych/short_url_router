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
      throw new Error(`Failed to create short URL: ${err.message}`);
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
      if (err.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to get original URL: ${err.message}`);
    }
  }
}

module.exports = ShortIoProvider;
