import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../lib/utils';

// Dynamic form schema based on fields
const createFormSchema = (fields: FormField[]) => {
  const schema: Record<string, z.ZodType> = {};

  fields.forEach((field) => {
    let fieldSchema: z.ZodType;

    switch (field.type) {
      case 'email':
        fieldSchema = z.string().email('Invalid email address');
        break;
      case 'number':
        fieldSchema = z.number().min(field.validation?.min || 0).max(field.validation?.max || Infinity);
        break;
      case 'select':
        fieldSchema = z.string().min(1, 'Please select an option');
        break;
      case 'json':
        fieldSchema = z.record(z.string(), z.any()).refine((val) => {
          try {
            JSON.stringify(val);
            return true;
          } catch {
            return false;
          }
        }, 'Invalid JSON format');
        break;
      default:
        fieldSchema = z.string();
    }

    if (field.required) {
      fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
    }

    if (field.validation?.pattern) {
      fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.validation.pattern), 'Invalid format');
    }

    schema[field.name] = fieldSchema;
  });

  return z.object(schema);
};

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'json';
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For select fields
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface FormBuilderProps {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  initialData?: Record<string, unknown>;
  submitLabel?: string;
  isLoading?: boolean;
  className?: string;
  showConfetti?: boolean;
}

export function FormBuilder({
  fields,
  onSubmit,
  initialData = {},
  submitLabel = 'Submit',
  isLoading = false,
  className,
  showConfetti = true
}: FormBuilderProps) {
  const schema = createFormSchema(fields);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  });

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      await onSubmit(data);
      if (showConfetti) {
        // Trigger confetti animation
        const event = new CustomEvent('form-success');
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.name]?.message as string;

    switch (field.type) {
      case 'textarea':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <motion.textarea
                  {...controllerField}
                  value={controllerField.value as string}
                  placeholder={field.placeholder}
                  disabled={isLoading}
                  className={cn(
                    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all duration-200 disabled:opacity-50',
                    fieldError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  whileFocus={{ scaleY: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
                {fieldError && (
                  <motion.p
                    className="text-sm text-red-600"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {fieldError}
                  </motion.p>
                )}
              </div>
            )}
          />
        );

      case 'select':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <motion.select
                  {...controllerField}
                  value={controllerField.value as string}
                  disabled={isLoading}
                  className={cn(
                    'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue transition-all duration-200 disabled:opacity-50',
                    fieldError && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                  whileFocus={{ scaleY: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <option value="">{field.placeholder || `Select ${field.label.toLowerCase()}`}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </motion.select>
                {fieldError && (
                  <motion.p
                    className="text-sm text-red-600"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {fieldError}
                  </motion.p>
                )}
              </div>
            )}
          />
        );

      case 'json':
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <div className="overflow-hidden border border-gray-300 rounded-md">
                  <Editor
                    height="300px"
                    language="json"
                    value={typeof controllerField.value === 'object'
                      ? JSON.stringify(controllerField.value, null, 2)
                      : String(controllerField.value || '{}')
                    }
                    onChange={(value) => {
                      try {
                        const parsed = JSON.parse(value || '{}');
                        setValue(field.name, parsed);
                      } catch {
                        // Invalid JSON, keep the raw value
                        setValue(field.name, value || '{}');
                      }
                    }}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      insertSpaces: true,
                    }}
                    theme="vs-dark"
                  />
                </div>
                {fieldError && (
                  <motion.p
                    className="text-sm text-red-600"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {fieldError}
                  </motion.p>
                )}
              </div>
            )}
          />
        );

      default:
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: controllerField }) => (
              <Input
                {...controllerField}
                value={controllerField.value as string}
                label={`${field.label}${field.required ? ' *' : ''}`}
                type={field.type}
                placeholder={field.placeholder}
                error={fieldError}
                disabled={isLoading}
                fullWidth
              />
            )}
          />
        );
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('space-y-6', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {fields.map((field) => renderField(field))}

      <div className="flex justify-end pt-4 space-x-3">
        <Button
          isLoading={isLoading}
          disabled={isLoading}
          className="min-w-[120px]"
          onClick={handleSubmit(handleFormSubmit)}
        >
          {submitLabel}
        </Button>
      </div>
    </motion.form>
  );
}