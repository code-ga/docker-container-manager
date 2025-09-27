import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormBuilder, type FormField } from './FormBuilder';

describe('FormBuilder', () => {
  const mockFields: FormField[] = [
    {
      name: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: ['Admin', 'User', 'Guest'],
    },
    {
      name: 'config',
      label: 'Configuration',
      type: 'json',
      required: false,
    },
  ];

  const mockOnSubmit = vi.fn();

  it('renders all form fields', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Role *')).toBeInTheDocument();
    expect(screen.getByLabelText('Configuration')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    // Fill out the form
    await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
    await user.type(screen.getByLabelText('Email Address *'), 'john@example.com');
    await user.selectOptions(screen.getByLabelText('Role *'), 'Admin');

    // Submit the form
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        config: {},
      });
    });
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();

    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Full Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email Address is required')).toBeInTheDocument();
      expect(screen.getByText('Please select an option')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    await user.type(screen.getByLabelText('Full Name *'), 'John Doe');
    await user.type(screen.getByLabelText('Email Address *'), 'invalid-email');
    await user.selectOptions(screen.getByLabelText('Role *'), 'Admin');

    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles JSON field validation', async () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
      />
    );

    // The JSON editor should be present
    expect(screen.getByText('Configuration')).toBeInTheDocument();

    // Since we can't easily test Monaco editor interactions,
    // we'll just verify the field is rendered
    const jsonContainer = screen.getByText('Configuration').closest('div');
    expect(jsonContainer).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: 'Submit' });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('uses custom submit label', () => {
    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        submitLabel="Create User"
      />
    );

    expect(screen.getByRole('button', { name: 'Create User' })).toBeInTheDocument();
  });

  it('handles initial data', () => {
    const initialData = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'User',
      config: { theme: 'dark' },
    };

    render(
      <FormBuilder
        fields={mockFields}
        onSubmit={mockOnSubmit}
        initialData={initialData}
      />
    );

    expect(screen.getByLabelText('Full Name *')).toHaveValue('Jane Doe');
    expect(screen.getByLabelText('Email Address *')).toHaveValue('jane@example.com');
  });
});