import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { PermissionsProvider } from '../../contexts/PermissionsContext';
import EggsListPage from './List';

// Mock the hooks
jest.mock('../../hooks/useEggs');
jest.mock('../../hooks/useContainers');
jest.mock('../../hooks/usePermissions');

import * as useEggsModule from '../../hooks/useEggs';
import * as useContainersModule from '../../hooks/useContainers';
import * as usePermissionsModule from '../../hooks/usePermissions';

const mockUseEggs = useEggsModule.useEggs;
const mockUseContainers = useContainersModule.useContainers;
const mockUsePermissions = usePermissionsModule.usePermissions;

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <PermissionsProvider>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </PermissionsProvider>
    </QueryClientProvider>
  );
};

describe('EggsListPage', () => {
  beforeEach(() => {
    mockUsePermissions.mockReturnValue({
      hasPermission: jest.fn().mockReturnValue(true),
    });

    mockUseEggs.mockReturnValue({
      data: {
        eggs: [
          {
            id: '1',
            name: 'Test Egg',
            image: 'nginx:alpine',
            description: 'Test description',
            environment: { TEST: 'value' },
            ports: [{ container: 80, protocol: 'tcp' }],
            volumes: [{ container: '/app', mount: '/data' }],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      },
      isLoading: false,
      error: null,
    });

    mockUseContainers.mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Test Container',
          status: 'running',
          nodeId: 'node1',
          eggId: '1',
          environment: {},
          ports: [],
          volumes: [],
          resources: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });
  });

  it('renders the page title and description', () => {
    renderWithProviders(<EggsListPage />);

    expect(screen.getByText('Eggs')).toBeInTheDocument();
    expect(screen.getByText('Manage your container eggs')).toBeInTheDocument();
  });

  it('renders the create button', () => {
    renderWithProviders(<EggsListPage />);

    expect(screen.getByText('Create Egg')).toBeInTheDocument();
  });

  it('renders search and filter inputs', () => {
    renderWithProviders(<EggsListPage />);

    expect(screen.getByPlaceholderText('Search eggs...')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Images')).toBeInTheDocument();
  });

  it('renders view mode toggles', () => {
    renderWithProviders(<EggsListPage />);

    // Should render grid and list view buttons
    const gridButton = screen.getByRole('button', { name: /grid/i });
    const listButton = screen.getByRole('button', { name: /list/i });

    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseEggs.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    renderWithProviders(<EggsListPage />);

    // Should show loading skeletons
    expect(screen.getAllByTestId('loading-skeleton')).toBeTruthy();
  });

  it('displays error state', () => {
    mockUseEggs.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load eggs'),
    });

    renderWithProviders(<EggsListPage />);

    expect(screen.getByText(/Failed to load eggs/)).toBeInTheDocument();
  });

  it('displays empty state when no eggs found', () => {
    mockUseEggs.mockReturnValue({
      data: {
        eggs: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      },
      isLoading: false,
      error: null,
    });

    renderWithProviders(<EggsListPage />);

    expect(screen.getByText('No eggs found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first egg')).toBeInTheDocument();
  });
});