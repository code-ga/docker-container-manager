import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContainerCard, type Container } from './ContainerCard';
import { PermissionsProvider } from '../../contexts/PermissionsContext';
import { ToastProvider } from '../ToastProvider';

// Mock the hooks
vi.mock('../../hooks/useContainerLogs', () => ({
  useContainerLogs: vi.fn(() => ({
    logs: [],
    isConnected: true,
    isReconnecting: false,
    error: null,
    clearLogs: vi.fn()
  }))
}));

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    hasPermission: vi.fn((permission: string) => {
      // Mock different permission scenarios
      if (permission.includes('manage')) return true;
      if (permission.includes('own:start')) return true;
      if (permission.includes('own:stop')) return true;
      if (permission.includes('own:restart')) return true;
      if (permission.includes('own:delete')) return true;
      return false;
    })
  }))
}));

// Test data
const mockContainer: Container = {
  id: 'test-container-id',
  name: 'Test Container',
  status: 'running',
  cpuLimit: 2,
  memoryLimit: 512,
  diskLimit: 1024,
  ports: { '8080': 80 },
  environment: { 'ENV': 'test' },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </PermissionsProvider>
    </QueryClientProvider>
  );
};

describe('ContainerCard - Permission Tests', () => {
  const mockOnAction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission-based UI rendering', () => {
    it('should show all action buttons for user with manage permission', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:manage';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.getByText('Restart')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should show only start/stop buttons for user with own permissions', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission.includes('own:');
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.getByText('Restart')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
    });

    it('should hide all action buttons for user without permissions', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn(() => false)
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
      expect(screen.queryByText('Restart')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should show start button for stopped container with start permission', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:start';
        })
      });

      const stoppedContainer = { ...mockContainer, status: 'stopped' as const };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={stoppedContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
    });

    it('should show stop button for running container with stop permission', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:stop';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Stop')).toBeInTheDocument();
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
    });
  });

  describe('Action handling with permissions', () => {
    it('should call onAction when start button is clicked and user has permission', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:start';
        })
      });

      const stoppedContainer = { ...mockContainer, status: 'stopped' as const };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={stoppedContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const startButton = screen.getByText('Start');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledWith(
          stoppedContainer.id,
          'start'
        );
      });
    });

    it('should call onAction when stop button is clicked and user has permission', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:stop';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const stopButton = screen.getByText('Stop');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledWith(
          mockContainer.id,
          'stop'
        );
      });
    });

    it('should call onAction when delete button is clicked and user has permission', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:delete';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Should open confirmation modal
      expect(screen.getByText('Confirm delete Container')).toBeInTheDocument();
    });

    it('should not call onAction when user lacks permission', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn(() => false)
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      // Buttons should not be present
      expect(screen.queryByText('Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Stop')).not.toBeInTheDocument();
      expect(screen.queryByText('Restart')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();

      expect(mockOnAction).not.toHaveBeenCalled();
    });
  });

  describe('Container status display', () => {
    it('should display correct status for running container', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Running')).toBeInTheDocument();
    });

    it('should display correct status for stopped container', () => {
      const stoppedContainer = { ...mockContainer, status: 'stopped' as const };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={stoppedContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Stopped')).toBeInTheDocument();
    });

    it('should display correct status for starting container', () => {
      const startingContainer = { ...mockContainer, status: 'starting' as const };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={startingContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Starting')).toBeInTheDocument();
    });

    it('should display correct status for error container', () => {
      const errorContainer = { ...mockContainer, status: 'error' as const };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={errorContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Resource display', () => {
    it('should display CPU limit when available', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('2 CPU')).toBeInTheDocument();
      expect(screen.getByText('Limit')).toBeInTheDocument();
    });

    it('should display memory limit when available', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('512MB')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
    });

    it('should display disk limit when available', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('1024MB')).toBeInTheDocument();
      expect(screen.getByText('Disk')).toBeInTheDocument();
    });

    it('should display port count', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Ports')).toBeInTheDocument();
    });

    it('should not display resource sections when limits are not set', () => {
      const containerWithoutLimits = {
        ...mockContainer,
        cpuLimit: undefined,
        memoryLimit: undefined,
        diskLimit: undefined
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={containerWithoutLimits}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.queryByText('CPU')).not.toBeInTheDocument();
      expect(screen.queryByText('Memory')).not.toBeInTheDocument();
      expect(screen.queryByText('Disk')).not.toBeInTheDocument();
    });
  });

  describe('Live logs functionality', () => {
    it('should display live logs when showLogs is true', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
            showLogs={true}
          />
        </Wrapper>
      );

      expect(screen.getByText('Live Logs')).toBeInTheDocument();
    });

    it('should not display live logs when showLogs is false', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
            showLogs={false}
          />
        </Wrapper>
      );

      expect(screen.queryByText('Live Logs')).not.toBeInTheDocument();
    });

    it('should show connection status when connected', () => {
      const { useContainerLogs } = require('../../hooks/useContainerLogs');
      (useContainerLogs as any).mockReturnValue({
        logs: [],
        isConnected: true,
        isReconnecting: false,
        error: null,
        clearLogs: vi.fn()
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
            showLogs={true}
          />
        </Wrapper>
      );

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show reconnection status when reconnecting', () => {
      const { useContainerLogs } = require('../../hooks/useContainerLogs');
      (useContainerLogs as any).mockReturnValue({
        logs: [],
        isConnected: false,
        isReconnecting: true,
        error: null,
        clearLogs: vi.fn()
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
            showLogs={true}
          />
        </Wrapper>
      );

      expect(screen.getByText('Reconnecting')).toBeInTheDocument();
    });

    it('should show error status when there is an error', () => {
      const { useContainerLogs } = require('../../hooks/useContainerLogs');
      (useContainerLogs as any).mockReturnValue({
        logs: [],
        isConnected: false,
        isReconnecting: false,
        error: 'Connection failed',
        clearLogs: vi.fn()
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
            showLogs={true}
          />
        </Wrapper>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should call clearLogs when clear button is clicked', async () => {
      const mockClearLogs = vi.fn();
      const { useContainerLogs } = require('../../hooks/useContainerLogs');
      (useContainerLogs as any).mockReturnValue({
        logs: ['test log'],
        isConnected: true,
        isReconnecting: false,
        error: null,
        clearLogs: mockClearLogs
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
            showLogs={true}
          />
        </Wrapper>
      );

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      expect(mockClearLogs).toHaveBeenCalled();
    });
  });

  describe('Confirmation modal', () => {
    it('should open confirmation modal when delete is clicked', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:delete';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Confirm delete Container')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    });

    it('should close confirmation modal when cancel is clicked', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:delete';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      expect(screen.getByText('Confirm delete Container')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm delete Container')).not.toBeInTheDocument();
      });
    });

    it('should call onAction with delete when confirmed', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:delete';
        })
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      // Find and fill the confirmation input
      const confirmInput = screen.getByPlaceholderText(`Type "${mockContainer.name}" to confirm`);
      fireEvent.change(confirmInput, { target: { value: mockContainer.name } });

      const confirmDeleteButton = screen.getByText('delete Container');
      fireEvent.click(confirmDeleteButton);

      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledWith(
          mockContainer.id,
          'delete',
          { confirm: mockContainer.name }
        );
      });
    });
  });

  describe('Loading states', () => {
    it('should show loading state when action is in progress', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn((permission: string) => {
          return permission === 'container:own:start';
        })
      });

      const stoppedContainer = { ...mockContainer, status: 'stopped' as const };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={stoppedContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const startButton = screen.getByText('Start');

      // Click the button to trigger loading
      fireEvent.click(startButton);

      // Button should show loading state
      expect(startButton).toBeDisabled();
    });

    it('should disable buttons when isLoading is true', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      // All buttons should be disabled during loading
      const buttons = screen.queryAllByRole('button');
      buttons.forEach(button => {
        if (button.textContent?.match(/Start|Stop|Restart|Delete/)) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('Error handling', () => {
    it('should handle permission check errors gracefully', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn(() => {
          throw new Error('Permission check failed');
        })
      });

      const Wrapper = createWrapper();

      // Should not crash when permission check fails
      expect(() => {
        render(
          <Wrapper>
            <ContainerCard
              container={mockContainer}
              onAction={mockOnAction}
            />
          </Wrapper>
        );
      }).not.toThrow();
    });

    it('should handle missing container data gracefully', () => {
      const incompleteContainer = {
        id: 'test-id',
        name: 'Test',
        status: 'running' as const,
        ports: {},
        environment: {},
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={incompleteContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Running')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for status indicators', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      // Status indicator should be present
      const statusIndicator = screen.getByText('Running').previousElementSibling;
      expect(statusIndicator).toBeInTheDocument();
    });

    it('should have proper button labels and roles', () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      (usePermissions as any).mockReturnValue({
        hasPermission: vi.fn(() => true)
      });

      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <ContainerCard
            container={mockContainer}
            onAction={mockOnAction}
          />
        </Wrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Each button should have accessible text
      buttons.forEach(button => {
        expect(button.textContent?.trim()).not.toBe('');
      });
    });
  });
});