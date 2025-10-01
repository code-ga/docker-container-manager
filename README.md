# Lormas Container Manager

A modern, web-based container management system built with Node.js, React, and PostgreSQL. Lormas provides a centralized interface for managing Docker containers across multiple nodes with real-time monitoring and control capabilities.

## Features

- 🐳 **Multi-node Docker Management**: Control containers across multiple servers from a single interface
- 🔄 **Real-time Monitoring**: Live container logs and status updates via WebSocket
- 🔐 **Authentication & Authorization**: Secure access with role-based permissions
- 📊 **Dashboard Analytics**: Comprehensive overview of container and node performance
- 🚀 **Container Lifecycle Management**: Create, start, stop, restart, and delete containers
- 📝 **Log Streaming**: Real-time container log streaming and filtering
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Frontend Features

The Lormas Container Manager now includes a comprehensive frontend application with modern UI components and real-time management capabilities.

### New Pages and Features

- **Dashboard Pages**:
  - **Nodes Management** (`/dashboard/nodes`): Create, edit, delete, and monitor nodes with real-time status updates
  - **Clusters Management** (`/dashboard/clusters`): Organize nodes into clusters for better resource management
  - **Eggs Management** (`/dashboard/eggs`): Create and manage container templates with JSON configuration editor
  - **Admin Settings** (`/settings/admin`): Enhanced user and role management with bulk operations

- **Container Migration Features**:
  - **High Availability (HA) Containers**: Automatic migration on node failure
  - **Manual Migration**: Trigger container migration between nodes
  - **Migration History**: Track all migration events with status and timestamps
  - **Real-time Updates**: Live migration status via WebSocket

- **Enhanced Components**:
  - **NodeCard**: Real-time node status with resource monitoring
  - **ContainerCard**: Container lifecycle management with logs viewer
  - **DataTable**: Advanced table with search, filtering, and pagination
  - **FormBuilder**: Dynamic form generation for CRUD operations
  - **LogViewer**: Real-time container log streaming with syntax highlighting

### Frontend Quick Start

#### Development Setup

```bash
# Install frontend dependencies
cd frontend
bun install

# Start development server with hot reload
bun run dev
```

#### Production Build

```bash
# Build for production
cd frontend
bun run build

# Preview production build
bun run preview
```

#### Integration with Backend

The frontend integrates seamlessly with the backend API:

- **API Endpoints**: Uses `/api/nodes`, `/api/clusters`, `/api/eggs`, `/api/containers` endpoints
- **WebSocket Integration**: Real-time updates via `/api/ws/logs` for container logs
- **Authentication**: JWT-based auth with automatic token refresh
- **Role-based UI**: Components adapt based on user permissions

### Architecture

Lormas consists of three main components:

- **Backend API**: Node.js/Bun server with TypeScript, PostgreSQL database, and WebSocket support
- **Frontend**: React application with Vite build system and modern UI components
- **Node Agents**: Lightweight agents that run on each server to execute Docker commands

## Prerequisites

- **Docker** (version 20.10 or later)
- **Docker Compose** (version 2.0 or later)
- **Git** for cloning the repository

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone <repository-url>
cd lormas-container-manager
```

### 2. Configure Environment Variables

Copy the shared environment file and update it with your configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your specific configuration:

```env
# Database Configuration
POSTGRES_DB=lormas
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-postgres-password

# Authentication Secret (64 characters)
AUTH_SECRET=your-super-secret-64-character-auth-key-change-this-in-production

# API Configuration
VITE_API_URL=http://localhost:3000

# WebSocket Server URL for Node Agents
SERVER_URL=ws://localhost:3000

# Database URL for backend (constructed from above variables)
DATABASE_URL=postgresql://postgres:your-secure-postgres-password@db:5432/lormas

# OAuth Configuration (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
```

**Important**:
- Set a strong `POSTGRES_PASSWORD` for database security
- Generate a secure 64-character `AUTH_SECRET` for authentication
- Configure OAuth credentials if using GitHub/Discord authentication
- **Never commit the `.env` file to version control**

### 3. Start the Application

```bash
docker-compose up -d
```

This command will:
- Start PostgreSQL database
- Build and start the backend API server
- Build and start the frontend application with Vite preview server
- Start nginx reverse proxy to route traffic between services
- Create necessary volumes for data persistence

### 4. Access the Application

- **Frontend**: http://localhost (via nginx reverse proxy)
- **Backend API**: http://localhost/api (via nginx reverse proxy)
- **API Documentation**: http://localhost/api/docs
- **Direct Backend**: http://localhost:3000 (for development/debugging)
- **Direct Frontend**: http://localhost:5173 (for development/debugging)

### 5. Stop the Application

```bash
docker-compose down
```

### 6. View Logs

```bash
# View all service logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs in real-time
docker-compose logs -f
```

## Docker Services

### Database (PostgreSQL)
- **Image**: postgres:15
- **Port**: 5432
- **Data Volume**: postgres_data
- **Health Check**: Database connectivity verification

### Backend API
- **Build Context**: ./backend
- **Port**: 3000 (internal only)
- **Dependencies**: PostgreSQL database
- **Environment**: Production optimized
- **Health Check**: API endpoint availability

### Frontend Application
- **Build Context**: ./frontend
- **Port**: 5173 (internal only)
- **Dependencies**: Backend API
- **Environment**: Production optimized with Vite preview server
- **Health Check**: HTTP endpoint availability

### Nginx Reverse Proxy
- **Image**: nginx:alpine
- **Port**: 80 (external)
- **Dependencies**: Backend API and Frontend Application
- **Configuration**: Routes /api and /ws to backend, / to frontend
- **Health Check**: HTTP endpoint availability

## Reverse Proxy Configuration

The nginx reverse proxy provides unified access to all services:

- **Frontend**: Accessible at `http://localhost/` (proxied to frontend:5173)
- **API**: Accessible at `http://localhost/api` (proxied to backend:3000)
- **WebSocket**: Accessible at `http://localhost/ws` (proxied to backend:3000 with upgrade support)
- **Direct Access**: Services remain accessible on their internal ports for development/debugging

### Customizing Nginx Configuration

To modify the reverse proxy behavior, edit the `nginx/nginx.conf` file in the nginx directory. The configuration includes:

- API routing to backend service
- WebSocket proxy with proper upgrade headers
- Frontend serving for all other requests
- Proper header forwarding for authentication and logging

## Development Setup

### Backend Development

```bash
cd backend
bun install
# Use the shared .env file from the root directory
# Edit ../.env with your database configuration
bun run dev
```

### Frontend Development

```bash
cd frontend
npm install
# Use the shared .env file from the root directory
# Edit ../.env with your API endpoint
npm run dev
```

## Development with Hot Reload (Docker)

For development with automatic hot reloading using Docker Compose, use the development profile:

### Start Development Environment

```bash
# Start all services with development profile
docker-compose --profile dev up -d

# Or start specific services
docker-compose --profile dev up -d db backend frontend
```

### Development Features

- **Backend**: Automatic rebuild on source code changes in `./backend/src`
- **Frontend**: File synchronization for Vite HMR (Hot Module Replacement)
- **Database**: Persistent PostgreSQL with migrations
- **Live Reload**: Changes in source code automatically sync/rebuild containers

### Access Development Environment

- **Frontend**: http://localhost (via nginx reverse proxy)
- **Backend API**: http://localhost/api (via nginx reverse proxy)
- **Direct Backend**: http://localhost:3000 (for development/debugging)
- **Direct Frontend**: http://localhost:5173 (for development/debugging)

### File Watching

The development setup includes file watching for:

**Backend (`./backend/src`)**:
- Monitors TypeScript files in the `src` directory
- Triggers container rebuild on file changes
- Preserves node_modules to avoid reinstalling dependencies

**Frontend (`./frontend/src`)**:
- Syncs source files to container for Vite HMR
- Enables hot reloading in the browser
- Preserves node_modules to avoid reinstalling dependencies

### Stop Development Environment

```bash
# Stop all development services
docker-compose --profile dev down

# Stop and remove volumes (removes database data)
docker-compose --profile dev down -v
```

### View Development Logs

```bash
# View all development service logs
docker-compose --profile dev logs -f

# View specific service logs
docker-compose --profile dev logs -f backend
docker-compose --profile dev logs -f frontend
```

### Troubleshooting Development Mode

**Hot Reload Not Working**:
```bash
# Check if services are running with dev profile
docker-compose --profile dev ps

# Rebuild services if needed
docker-compose --profile dev build --no-cache backend frontend

# Restart specific service
docker-compose --profile dev restart backend
```

**File Changes Not Detected**:
- Ensure you're editing files in the correct directories (`./backend/src`, `./frontend/src`)
- Check Docker Desktop file sharing settings
- Verify the container has proper permissions for file watching

## Configuration

### Environment Variables

#### Shared Configuration (.env)
- `POSTGRES_DB`: PostgreSQL database name (default: lormas)
- `POSTGRES_USER`: PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD`: PostgreSQL password (required)
- `AUTH_SECRET`: Authentication secret key (64 characters, required)
- `VITE_API_URL`: Backend API base URL (default: http://localhost:3000)
- `SERVER_URL`: WebSocket server URL for node agents (default: ws://localhost:3000)
- `DATABASE_URL`: PostgreSQL connection string (auto-constructed)
- `GITHUB_CLIENT_ID/SECRET`: GitHub OAuth credentials (optional)
- `DISCORD_CLIENT_ID/SECRET`: Discord OAuth credentials (optional)

### Database

The application uses PostgreSQL with the following default configuration:
- Database: lormas (configurable via `POSTGRES_DB`)
- Username: postgres (configurable via `POSTGRES_USER`)
- Password: Set in `.env` file (configurable via `POSTGRES_PASSWORD`)
- Port: 5432

Database migrations are automatically applied on startup.

## Security Considerations

### Production Deployment
1. **Change Default Passwords**: Update all default passwords in the shared `.env` file
2. **Use Strong Secrets**: Generate strong, unique secrets for authentication (especially `POSTGRES_PASSWORD` and `AUTH_SECRET`)
3. **Enable HTTPS**: Configure SSL/TLS certificates for production
4. **Network Security**: Use firewalls to restrict access to necessary ports
5. **Regular Updates**: Keep Docker images and dependencies updated
6. **Environment Security**: Ensure the `.env` file is not committed to version control

### Authentication
- Supports GitHub and Discord OAuth providers
- JWT-based session management
- Role-based access control (RBAC)
- Secure password hashing with bcrypt

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if database container is running
docker-compose ps

# View database logs
docker-compose logs db

# Restart database service
docker-compose restart db
```

**Backend Won't Start**
```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env

# Restart backend service
docker-compose restart backend
```

**Frontend Build Fails**
```bash
# Rebuild frontend
docker-compose build --no-cache frontend

# Check frontend logs
docker-compose logs frontend
```

### Health Checks

All services include health checks to ensure proper operation:
- Database: PostgreSQL connectivity
- Backend: API endpoint availability
- Frontend: HTTP endpoint availability

### Logs and Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Check service status
docker-compose ps
```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the application logs
3. Verify your environment configuration
4. Check the GitHub repository for known issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.