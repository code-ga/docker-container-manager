import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminPage from './AdminPage';

// Mock the hooks
vi.mock('../../hooks/useUsers', () => ({
  useUsers: () => ({
    data: { users: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useCreateUser: () => ({
    mutateAsync: vi.fn(),
  }),
  useUpdateUser: () => ({
    mutateAsync: vi.fn(),
  }),
  useDeleteUser: () => ({
    mutateAsync: vi.fn(),
  }),
  useBulkUpdateRoles: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../hooks/useRoles', () => ({
  useRoles: () => ({
    data: { roles: [] },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useRolesWithPermissions: () => ({
    data: { roles: [] },
  }),
  useCreateRole: () => ({
    mutateAsync: vi.fn(),
  }),
  useUpdateRole: () => ({
    mutateAsync: vi.fn(),
  }),
  useDeleteRole: () => ({
    mutateAsync: vi.fn(),
  }),
  useUpdateRolePermissions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: vi.fn(() => true),
    hasAnyPermission: vi.fn(() => true),
  }),
}));

// Mock the components
vi.mock('../../components/entities/UsersTable', () => ({
  UsersTable: ({ users, onEdit, onDelete }: any) => (
    <div data-testid="users-table">
      <div>Users Table - {users.length} users</div>
      <button onClick={() => onEdit(users[0])}>Edit User</button>
      <button onClick={() => onDelete('user-id')}>Delete User</button>
    </div>
  ),
}));

vi.mock('../../components/entities/RolesTable', () => ({
  RolesTable: ({ roles, onEdit, onDelete }: any) => (
    <div data-testid="roles-table">
      <div>Roles Table - {roles.length} roles</div>
      <button onClick={() => onEdit(roles[0])}>Edit Role</button>
      <button onClick={() => onDelete('role-id')}>Delete Role</button>
    </div>
  ),
}));

vi.mock('../../components/entities/PermissionMatrix', () => ({
  PermissionMatrix: ({ roles }: any) => (
    <div data-testid="permission-matrix">
      Permission Matrix - {roles.length} roles
    </div>
  ),
}));

vi.mock('../../components/entities/BulkRoleModal', () => ({
  BulkRoleModal: ({ isOpen, onClose }: any) => (
    isOpen ? (
      <div data-testid="bulk-role-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/ui/Modal', () => ({
  Modal: ({ isOpen, children, onClose }: any) => (
    isOpen ? (
      <div data-testid="modal">
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/entities/UserForm', () => ({
  UserForm: ({ onSave, onCancel }: any) => (
    <div data-testid="user-form">
      <button onClick={() => onSave({ name: 'Test User', email: 'test@example.com' })}>
        Save User
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock('../../components/entities/RoleForm', () => ({
  RoleForm: ({ onSave, onCancel }: any) => (
    <div data-testid="role-form">
      <button onClick={() => onSave({ name: 'Test Role', permissions: [] })}>
        Save Role
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the admin page with tabs', async () => {
    renderWithProviders(<AdminPage />);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
  });

  it('displays users table in users tab', async () => {
    renderWithProviders(<AdminPage />);

    // Click on Users tab
    fireEvent.click(screen.getByText('Users'));

    await waitFor(() => {
      expect(screen.getByTestId('users-table')).toBeInTheDocument();
    });
  });

  it('displays roles table and permission matrix in roles tab', async () => {
    renderWithProviders(<AdminPage />);

    // Click on Roles tab
    fireEvent.click(screen.getByText('Roles'));

    await waitFor(() => {
      expect(screen.getByTestId('roles-table')).toBeInTheDocument();
      expect(screen.getByTestId('permission-matrix')).toBeInTheDocument();
    });
  });

  it('displays permission matrix in permissions tab', async () => {
    renderWithProviders(<AdminPage />);

    // Click on Permissions tab
    fireEvent.click(screen.getByText('Permissions'));

    await waitFor(() => {
      expect(screen.getByTestId('permission-matrix')).toBeInTheDocument();
    });
  });

  it('opens create user modal when create button is clicked', async () => {
    renderWithProviders(<AdminPage />);

    // Click on Users tab first
    fireEvent.click(screen.getByText('Users'));

    // Click create user button
    await waitFor(() => {
      const createButton = screen.getByText('Create User');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });
  });

  it('opens create role modal when create button is clicked', async () => {
    renderWithProviders(<AdminPage />);

    // Click on Roles tab first
    fireEvent.click(screen.getByText('Roles'));

    // Click create role button
    await waitFor(() => {
      const createButton = screen.getByText('Create Role');
      fireEvent.click(createButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('role-form')).toBeInTheDocument();
    });
  });
});