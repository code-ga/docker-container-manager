# Lormas Container Manager Frontend

A modern, dark-themed React application for managing Docker containers across multiple nodes with real-time monitoring and anime-inspired UI elements.

## Features

### Core Pages
- **Dashboard**: Overview of system status, recent activity, and quick actions
- **Nodes Management** (`/dashboard/nodes`): Create, edit, delete, and monitor nodes with real-time status
- **Clusters Management** (`/dashboard/clusters`): Organize nodes into logical groups for better resource management
- **Eggs Management** (`/dashboard/eggs`): Create and manage container templates with JSON configuration editor
- **Containers Management** (`/dashboard/containers`): Full container lifecycle management with real-time logs
- **Admin Settings** (`/settings/admin`): Enhanced user and role management with bulk operations

### Key Components
- **NodeCard**: Real-time node status with resource monitoring and health indicators
- **ContainerCard**: Container lifecycle management with integrated logs viewer
- **DataTable**: Advanced table component with search, filtering, sorting, and pagination
- **FormBuilder**: Dynamic form generation for CRUD operations with validation
- **LogViewer**: Real-time container log streaming with syntax highlighting and filtering
- **MigrationStatus**: Visual indicators for HA container migration progress

### Custom Hooks
- **useNodes**: Node management with real-time status updates
- **useClusters**: Cluster operations and node assignments
- **useEggs**: Egg template management and validation
- **useContainers**: Container lifecycle and real-time monitoring
- **useContainerLogs**: WebSocket-based log streaming with reconnection logic
- **useContainerHA**: High availability container management and migration
- **usePermissions**: Role-based access control for UI components
- **useWebSocket**: Real-time communication with backend services

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with HMR support
- **Styling**: Tailwind CSS with custom dark theme and neon gradients
- **Animations**: Framer Motion for smooth transitions and anime-style effects
- **State Management**: React Context + custom hooks
- **HTTP Client**: Axios for API communication
- **Real-time**: Native WebSocket integration
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom component library with Tailwind styling

## Development

### Prerequisites
- **Node.js** 18+ or **Bun** (recommended)
- **Package Manager**: npm, yarn, or bun

### Installation

```bash
# Install dependencies
bun install
# or
npm install
```

### Development Server

```bash
# Start development server with hot reload
bun run dev
# or
npm run dev
```

The application will be available at `http://localhost:5173` with hot module replacement enabled.

### Build Commands

```bash
# Build for production
bun run build
# or
npm run build

# Preview production build
bun run preview
# or
npm run preview

# Type checking
bun run type-check
# or
npm run type-check

# Lint code
bun run lint
# or
npm run lint
```

## Architecture Overview

The frontend follows a modular architecture with clear separation of concerns:

### Routing Structure
```
Public Routes:
├── /login - Authentication page
└── /register - User registration

Protected Routes:
├── /dashboard - Main dashboard
│   ├── /nodes - Node management
│   ├── /clusters - Cluster management
│   ├── /eggs - Egg templates
│   └── /containers - Container management
└── /settings - User settings
    └── /admin - Administrative functions
```

### Component Architecture
- **Pages**: Route-level components (Nodes, Clusters, Eggs, etc.)
- **Components**: Reusable UI components (DataTable, FormBuilder, etc.)
- **Hooks**: Custom hooks for data fetching and state management
- **Providers**: Context providers for global state (Auth, Theme, etc.)
- **Utils**: Utility functions and API clients

### State Management
- **Local State**: React useState/useReducer for component state
- **Global State**: Context API for authentication and theme
- **Server State**: Custom hooks with API integration
- **Real-time State**: WebSocket integration for live updates

For detailed architecture information, see [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md).

## API Integration

The frontend integrates with the Lormas backend API:

### Core Endpoints
- `GET /api/nodes` - List and manage nodes
- `GET /api/clusters` - List and manage clusters
- `GET /api/eggs` - List and manage egg templates
- `GET /api/containers` - List and manage containers
- `GET /api/users` - User management (admin)
- `GET /api/roles` - Role management (admin)

### WebSocket Endpoints
- `WS /api/ws/logs` - Real-time container logs
- `WS /api/ws/nodes` - Node status updates

### Authentication
- JWT-based authentication with automatic token refresh
- Role-based route protection
- Permission-based component rendering

## Development Guidelines

### Code Organization
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Input, etc.)
│   ├── data/           # Data display components (DataTable, etc.)
│   ├── entities/       # Entity-specific components (NodeCard, etc.)
│   └── layout/         # Layout components (Navbar, etc.)
├── hooks/              # Custom React hooks
├── pages/              # Page-level components
├── lib/                # Utilities and API clients
├── contexts/           # React Context providers
└── types/              # TypeScript type definitions
```

### Styling Conventions
- Dark theme by default with neon accent colors
- Anime-inspired animations and effects
- Responsive design with mobile-first approach
- Consistent spacing using Tailwind classes

### Performance Considerations
- Lazy loading for page components
- Virtual scrolling for large data tables
- WebSocket reconnection with exponential backoff
- Optimistic updates for better UX
