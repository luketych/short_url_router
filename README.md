# URL Shortener Service

A Node.js service that provides URL shortening functionality using Short.io's API and stores the mappings in a Neon.tech PostgreSQL database.

## Features

- Shorten URLs using Short.io API
- Store URL mappings in PostgreSQL database
- Modular design for easy switching between URL shortening providers
- RESTful API endpoints

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required environment variables:
```env
DATABASE_URL=your_neon_postgres_url
SHORTIO_API_KEY=your_shortio_api_key
SHORTIO_DOMAIN=your_shortio_domain
PORT=3000 # optional
```

3. Initialize the database:
```bash
npm run db:init
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### GET /:shortCode
Retrieves the original URL for a given short code.

**Response:**
- 200 OK: Returns the original URL
- 404 Not Found: If short code doesn't exist
```json
{
  "url": "https://original-url.com"
}
```

### POST /shorten
Creates a new short URL.

**Request Body:**
```json
{
  "url": "https://long-url-to-shorten.com"
}
```

**Response:**
- 201 Created: Returns the shortened URL details
```json
{
  "originalUrl": "https://long-url-to-shorten.com",
  "shortCode": "abc123",
  "shortUrl": "https://your-domain.com/abc123"
}
```

## Architecture

The service uses a modular architecture that separates the URL shortening provider from the main application logic:

- `/src/services/urlShortener/interface.js` - Defines the interface for URL shortening providers
- `/src/services/urlShortener/shortIoProvider.js` - Short.io implementation
- `/src/db/` - Database connection and queries
- `/src/config.js` - Configuration management
- `/src/server.js` - Express server and routes

To implement a new URL shortening provider:
1. Create a new class that implements the `UrlShortenerInterface`
2. Update the provider instantiation in `server.js`

## Error Handling

- All endpoints include proper error handling
- Database errors are logged and handled gracefully
- API errors from Short.io are properly managed
