import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Test Label" />);

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('renders without label', () => {
    render(<Input />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('handles input changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input label="Test Input" onChange={handleChange} />);

    const input = screen.getByLabelText('Test Input');
    await user.type(input, 'test value');

    expect(handleChange).toHaveBeenCalledTimes(10); // 'test value' has 10 characters
  });

  it('shows error message', () => {
    render(<Input label="Test Input" error="This field is required" />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('shows helper text when no error', () => {
    render(<Input label="Test Input" helperText="This is a helper text" />);

    expect(screen.getByText('This is a helper text')).toBeInTheDocument();
    expect(screen.getByText('This is a helper text')).toHaveClass('text-gray-500');
  });

  it('does not show helper text when error is present', () => {
    render(
      <Input
        label="Test Input"
        helperText="This is a helper text"
        error="This field is required"
      />
    );

    expect(screen.queryByText('This is a helper text')).not.toBeInTheDocument();
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders with different input types', () => {
    const { rerender } = render(<Input label="Text Input" type="text" />);
    expect(screen.getByLabelText('Text Input')).toHaveAttribute('type', 'text');

    rerender(<Input label="Email Input" type="email" />);
    expect(screen.getByLabelText('Email Input')).toHaveAttribute('type', 'email');

    rerender(<Input label="Password Input" type="password" />);
    expect(screen.getByLabelText('Password Input')).toHaveAttribute('type', 'password');
  });

  it('renders with placeholder', () => {
    render(<Input label="Test Input" placeholder="Enter your name" />);

    const input = screen.getByLabelText('Test Input');
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
  });

  it('renders with icons', () => {
    render(
      <Input
        label="Test Input"
        leftIcon={<span>👈</span>}
        rightIcon={<span>👉</span>}
      />
    );

    expect(screen.getByText('👈')).toBeInTheDocument();
    expect(screen.getByText('👉')).toBeInTheDocument();
  });

  it('applies fullWidth class when specified', () => {
    render(<Input label="Test Input" fullWidth />);

    const container = screen.getByLabelText('Test Input').closest('div');
    expect(container).toHaveClass('w-full');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Input label="Test Input" disabled />);

    const input = screen.getByLabelText('Test Input');
    expect(input).toBeDisabled();
  });
});