import { render, screen, fireEvent } from '@testing-library/react';
import { NodeCard } from './NodeCard';
import type { Node } from '../../hooks/useEntities';

// Mock the usePermissions hook
jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => permission === 'node:manage',
  }),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

const mockNode: Node = {
  id: 'node-1',
  name: 'Test Node',
  description: 'A test node',
  status: 'online',
  resources: {
    cpu: 4,
    memory: '8GB',
    disk: '100GB',
  },
  containers: ['container-1', 'container-2'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

describe('NodeCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnAssign = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders node information correctly', () => {
    render(
      <NodeCard
        node={mockNode}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('2 containers')).toBeInTheDocument();
    expect(screen.getByText('A test node')).toBeInTheDocument();
  });

  it('shows action buttons when user has permissions', () => {
    render(
      <NodeCard
        node={mockNode}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    expect(screen.getByLabelText(/Edit node Test Node/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Assign node Test Node to cluster/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Delete node Test Node/)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <NodeCard
        node={mockNode}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const editButton = screen.getByLabelText(/Edit node Test Node/);
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockNode);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <NodeCard
        node={mockNode}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const deleteButton = screen.getByLabelText(/Delete node Test Node/);
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('node-1');
  });

  it('calls onAssign when assign button is clicked', () => {
    render(
      <NodeCard
        node={mockNode}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    const assignButton = screen.getByLabelText(/Assign node Test Node to cluster/);
    fireEvent.click(assignButton);

    expect(mockOnAssign).toHaveBeenCalledWith('node-1');
  });

  it('displays correct status badge for different statuses', () => {
    const offlineNode = { ...mockNode, status: 'offline' as const };

    render(
      <NodeCard
        node={offlineNode}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAssign={mockOnAssign}
      />
    );

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('hides actions when showActions is false', () => {
    render(
      <NodeCard
        node={mockNode}
        showActions={false}
      />
    );

    expect(screen.queryByLabelText(/Edit node Test Node/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Delete node Test Node/)).not.toBeInTheDocument();
  });
});