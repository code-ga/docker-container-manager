import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeStatus } from './NodeStatus';

describe('NodeStatus', () => {
  it('renders online status with correct label', () => {
    render(<NodeStatus status="online" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders offline status with correct label', () => {
    render(<NodeStatus status="offline" />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders maintenance status with correct label', () => {
    render(<NodeStatus status="maintenance" />);
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('hides label when showLabel is false', () => {
    render(<NodeStatus status="online" showLabel={false} />);
    expect(screen.queryByText('Online')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<NodeStatus status="online" className="custom-class" />);
    const statusDiv = container.firstChild as HTMLElement;
    expect(statusDiv).toHaveClass('custom-class');
  });
});