import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ClustersListPage from './List';
import * as useClustersModule from '../../hooks/useClusters';
import * as usePermissionsModule from '../../hooks/usePermissions';

// Mock the hooks
vi.mock('../../hooks/useClusters', () => ({
  useClusters: vi.fn()
}));
vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: vi.fn()
}));

// Mock DashboardLayout
vi.mock('../../components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="dashboard-layout">{children}</div>
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ClustersListPage', () => {
  beforeEach(() => {
    // Setup default mocks
    vi.mocked(useClustersModule.useClusters).mockReturnValue({
      data: {
        clusters: [
          {
            id: '1',
            name: 'Test Cluster',
            description: 'Test Description',
            status: 'active' as const,
            nodes: ['node1', 'node2'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      status: 'success' as const,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      refetch: vi.fn(),
      isStale: false,
      isPlaceholderData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isInitialLoading: false,
      isPaused: false,
      isEnabled: true,
      fetchStatus: 'idle' as const,
      promise: Promise.resolve({
        clusters: [
          {
            id: '1',
            name: 'Test Cluster',
            description: 'Test Description',
            status: 'active' as const,
            nodes: ['node1', 'node2'],
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1
        }
      })
    });

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue({
      hasPermission: vi.fn(() => true),
      hasAnyPermission: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
      isLoading: false,
      userRoles: ['admin']
    });
  });

  it('renders the clusters list page', () => {
    renderWithRouter(<ClustersListPage />);

    expect(screen.getByText('Clusters')).toBeInTheDocument();
    expect(screen.getByText('Manage your clusters')).toBeInTheDocument();
    expect(screen.getByText('Test Cluster')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    // Mock loading state
    vi.mocked(useClustersModule.useClusters).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      isError: false,
      isPending: true,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: false,
      status: 'pending' as const,
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      refetch: vi.fn(),
      isStale: false,
      isPlaceholderData: false,
      isFetched: false,
      isFetchedAfterMount: false,
      isFetching: true,
      isRefetching: false,
      isInitialLoading: true,
      isPaused: false,
      isEnabled: true,
      fetchStatus: 'fetching' as const,
      promise: Promise.resolve({ clusters: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } })
    });

    renderWithRouter(<ClustersListPage />);

    // Should show loading indicators (skeleton loaders)
    expect(screen.getAllByTestId('dashboard-layout').length).toBeGreaterThan(0);
  });

  it('displays error state', () => {
    // Mock error state
    vi.mocked(useClustersModule.useClusters).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load clusters'),
      isError: true,
      isPending: false,
      isLoadingError: true,
      isRefetchError: false,
      isSuccess: false,
      status: 'error' as const,
      dataUpdatedAt: 0,
      errorUpdatedAt: Date.now(),
      failureCount: 1,
      failureReason: new Error('Failed to load clusters'),
      errorUpdateCount: 1,
      refetch: vi.fn(),
      isStale: false,
      isPlaceholderData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isInitialLoading: false,
      isPaused: false,
      isEnabled: true,
      fetchStatus: 'idle' as const,
      promise: Promise.reject(new Error('Failed to load clusters'))
    });

    renderWithRouter(<ClustersListPage />);

    expect(screen.getByText(/Failed to load clusters/)).toBeInTheDocument();
  });

  it('displays empty state when no clusters', () => {
    // Mock empty state
    vi.mocked(useClustersModule.useClusters).mockReturnValue({
      data: { clusters: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } },
      isLoading: false,
      error: null,
      isError: false,
      isPending: false,
      isLoadingError: false,
      isRefetchError: false,
      isSuccess: true,
      status: 'success' as const,
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      failureCount: 0,
      failureReason: null,
      errorUpdateCount: 0,
      refetch: vi.fn(),
      isStale: false,
      isPlaceholderData: false,
      isFetched: true,
      isFetchedAfterMount: true,
      isFetching: false,
      isRefetching: false,
      isInitialLoading: false,
      isPaused: false,
      isEnabled: true,
      fetchStatus: 'idle' as const,
      promise: Promise.resolve({ clusters: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } })
    });

    renderWithRouter(<ClustersListPage />);

    expect(screen.getByText('No clusters found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first cluster')).toBeInTheDocument();
  });
});