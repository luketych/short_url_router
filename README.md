# URL Shortener Service

A Node.js service that provides URL shortening functionality using Short.io's API and stores the mappings in a Neon.tech PostgreSQL database.

## Features

- Shorten URLs using Short.io API
- Store URL mappings in PostgreSQL database
- Modular design for easy switching between URL shortening providers
- RESTful API endpoints
- Docker support for easy deployment

## Local Setup

### Installation

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

### Debugging

VS Code launch configurations are provided for debugging:

1. **Launch Server**: Start the server normally
2. **Debug Server**: Launch with Node inspector attached
3. **Launch with Nodemon**: Start with auto-reload for development
4. **Initialize Database**: Run the database initialization script

To use:
1. Open the Debug view in VS Code (`Cmd+Shift+D` on macOS, `Ctrl+Shift+D` on Windows/Linux)
2. Select a launch configuration from the dropdown
3. Start debugging with F5 or the play button

## Docker Deployment

### Using Docker Compose (Recommended)

1. Create `.env` file with your configuration (see above)

2. Build and start the container:
```bash
docker compose up -d
```

To stop the service:
```bash
docker compose down
```

### Manual Docker Deployment

1. Build the image:
```bash
docker build -t url-shortener .
```

2. Run the container:
```bash
docker run -d \
  --name url-shortener \
  -p 3000:3000 \
  --env-file .env \
  --restart unless-stopped \
  url-shortener
```

### Deployment to CentOS Server

1. Install Docker and Docker Compose on CentOS:
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. Clone the repository and navigate to the project directory

3. Create `.env` file with your configuration

4. Build and start the service:
```bash
sudo docker compose up -d
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

### POST /api/shorten
Creates a new short URL.

Note: URLs without a protocol (http:// or https://) will automatically have http:// prepended.

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

### GET /health
Health check endpoint for container monitoring.

**Response:**
```json
{
  "status": "ok"
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

## Error Handling & Logging

- All endpoints include proper error handling with detailed error messages
- Comprehensive request logging including timestamps and request details
- Database operations are logged for debugging
- API errors from Short.io are properly managed and logged
- Stack traces included in errors when NODE_ENV=development
- Health check endpoint for monitoring service status

Common Error Messages:
- `URL is required`: Request body missing `url` field
- `Invalid URL format`: The provided URL is not properly formatted
- `Failed to save URL`: Database operation failed
- `URL not found`: Short code doesn't exist in database

## Container Configuration

The service is containerized with the following features:
- Health checks
- Automatic restarts
- Resource limits (CPU and memory)
- Environment variable configuration
- Volume support for persistent data
