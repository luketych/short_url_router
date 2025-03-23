# Development Container for URL Shortener

This directory contains configuration files for setting up a development container using VS Code's Remote - Containers extension.

## Prerequisites

1. [Docker](https://www.docker.com/products/docker-desktop) installed on your machine
2. [Visual Studio Code](https://code.visualstudio.com/) installed
3. [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) installed in VS Code

## Getting Started

1. Open this project in VS Code
2. Copy `.devcontainer/.env.example` to a new file `.devcontainer/.env` and update with your credentials
3. Click on the green button in the bottom-left corner of VS Code or press F1 and select "Remote-Containers: Reopen in Container"
4. VS Code will build the container and open the project inside it

## Container Features

- Node.js 20 development environment
- PostgreSQL database with schema automatically applied
- Development tools pre-installed (git, curl, etc.)
- VS Code extensions pre-configured
- Port forwarding for the application (3000) and database (5432)

## Environment Variables

The development container uses a separate `.env` file located in the `.devcontainer` directory. This allows you to have different configurations for development and production.

## Database

The PostgreSQL database is initialized with the schema from `schema.sql`. You can connect to it using:

- Host: localhost
- Port: 5432
- Username: postgres
- Password: postgres
- Database: url_shortener

## Running the Application

Once inside the container, you can run the application using:

```bash
npm run dev
```

This will start the application in development mode with hot reloading.
