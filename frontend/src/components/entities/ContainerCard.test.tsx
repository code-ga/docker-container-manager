import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContainerCard } from './ContainerCard';

const mockContainer = {
  id: 'test-container',
  name: 'Test Container',
  status: 'running' as const,
  cpuLimit: 2,
  memoryLimit: 1024,
  diskLimit: 20480,
  ports: { '8080': 80 },
  environment: { NODE_ENV: 'production' },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOnAction = vi.fn();

describe('ContainerCard', () => {
  it('renders container information correctly', () => {
    render(<ContainerCard container={mockContainer} onAction={mockOnAction} />);

    expect(screen.getByText('Test Container')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('2 CPU')).toBeInTheDocument();
    expect(screen.getByText('1024MB')).toBeInTheDocument();
    expect(screen.getByText('20480MB')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Ports count
  });

  it('shows start button for stopped container', () => {
    const stoppedContainer = { ...mockContainer, status: 'stopped' as const };
    render(<ContainerCard container={stoppedContainer} onAction={mockOnAction} />);

    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('shows stop button for running container', () => {
    render(<ContainerCard container={mockContainer} onAction={mockOnAction} />);

    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('calls onAction when start button is clicked', () => {
    const stoppedContainer = { ...mockContainer, status: 'stopped' as const };
    render(<ContainerCard container={stoppedContainer} onAction={mockOnAction} />);

    const startButton = screen.getByText('Start');
    fireEvent.click(startButton);

    expect(mockOnAction).toHaveBeenCalledWith('test-container', 'start');
  });

  it('calls onAction when stop button is clicked', () => {
    render(<ContainerCard container={mockContainer} onAction={mockOnAction} />);

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    expect(mockOnAction).toHaveBeenCalledWith('test-container', 'stop');
  });

  it('calls onAction when restart button is clicked', () => {
    render(<ContainerCard container={mockContainer} onAction={mockOnAction} />);

    const restartButton = screen.getByText('Restart');
    fireEvent.click(restartButton);

    expect(mockOnAction).toHaveBeenCalledWith('test-container', 'restart');
  });

  it('opens delete confirmation modal when delete button is clicked', () => {
    render(<ContainerCard container={mockContainer} onAction={mockOnAction} />);

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(screen.getByText('Confirm delete Container')).toBeInTheDocument();
  });

  it('hides logs when showLogs is false', () => {
    render(<ContainerCard container={mockContainer} onAction={mockOnAction} showLogs={false} />);

    expect(screen.queryByText('Live Logs')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ContainerCard container={mockContainer} onAction={mockOnAction} className="custom-class" />
    );
    const cardDiv = container.firstChild as HTMLElement;
    expect(cardDiv).toHaveClass('custom-class');
  });
});