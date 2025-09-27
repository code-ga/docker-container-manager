import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleBadge } from './RoleBadge';

describe('RoleBadge', () => {
  it('renders with correct role text', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('applies correct color class for admin role', () => {
    const { container } = render(<RoleBadge role="admin" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-red-500');
  });

  it('applies correct color class for user role', () => {
    const { container } = render(<RoleBadge role="user" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-blue-500');
  });

  it('applies default color class for unknown role', () => {
    const { container } = render(<RoleBadge role="unknown" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('bg-gray-500');
  });

  it('applies custom className', () => {
    const { container } = render(<RoleBadge role="admin" className="custom-class" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('custom-class');
  });
});