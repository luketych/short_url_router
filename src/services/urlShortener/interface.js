/**
 * Interface for URL shortener services
 * This abstract class defines the contract that any URL shortening service must fulfill
 */
class UrlShortenerInterface {
  /**
   * Creates a short URL from a long URL
   * @param {string} longUrl - The original URL to be shortened
   * @returns {Promise<{shortCode: string, originalUrl: string}>}
   * @throws {Error} If the URL cannot be shortened
   */
  async shortenUrl(longUrl) {
    throw new Error('Method shortenUrl() must be implemented');
  }

  /**
   * Retrieves the original URL from a short code
   * @param {string} shortCode - The code part of the shortened URL
   * @returns {Promise<string|null>} The original URL or null if not found
   */
  async getOriginalUrl(shortCode) {
    throw new Error('Method getOriginalUrl() must be implemented');
  }
}

module.exports = UrlShortenerInterface;
