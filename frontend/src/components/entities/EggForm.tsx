import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePermissions } from '../../hooks/usePermissions';
import type { Egg } from '../../hooks/useEntities';

// Validation schema
const eggSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  image: z.string().min(1, 'Image is required'),
  environment: z.array(z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string(),
  })).optional(),
  ports: z.array(z.object({
    container: z.number().min(1).max(65535),
    protocol: z.enum(['tcp', 'udp']),
  })).optional(),
  volumes: z.array(z.object({
    container: z.string().min(1, 'Container path is required'),
    mount: z.string().min(1, 'Host path is required'),
  })).optional(),
});

type EggFormData = z.infer<typeof eggSchema>;

export interface EggFormProps {
  egg?: Egg | null;
  onSave: (data: EggFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EggForm: React.FC<EggFormProps> = ({
  egg,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const { hasPermission } = usePermissions();
  const isEdit = !!egg;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<EggFormData>({
    resolver: zodResolver(eggSchema),
    defaultValues: {
      name: egg?.name || '',
      description: egg?.description || '',
      image: egg?.image || '',
      environment: egg?.environment ? Object.entries(egg.environment).map(([key, value]) => ({ key, value })) : [],
      ports: egg?.ports?.map(port => ({ container: port.container, protocol: port.protocol as 'tcp' | 'udp' })) || [],
      volumes: egg?.volumes?.map(volume => ({ container: volume.container, mount: volume.mount })) || [],
    },
  });

  // Field arrays for dynamic fields
  const {
    fields: environmentFields,
    append: appendEnvironment,
    remove: removeEnvironment,
  } = useFieldArray({
    control,
    name: 'environment',
  });

  const {
    fields: portFields,
    append: appendPort,
    remove: removePort,
  } = useFieldArray({
    control,
    name: 'ports',
  });

  const {
    fields: volumeFields,
    append: appendVolume,
    remove: removeVolume,
  } = useFieldArray({
    control,
    name: 'volumes',
  });

  // Update form when egg changes (for edit mode)
  useEffect(() => {
    if (egg) {
      setValue('name', egg.name);
      setValue('description', egg.description || '');
      setValue('image', egg.image);
      setValue('environment', egg.environment ? Object.entries(egg.environment).map(([key, value]) => ({ key, value })) : []);
      setValue('ports', egg.ports?.map(port => ({ container: port.container, protocol: port.protocol as 'tcp' | 'udp' })) || []);
      setValue('volumes', egg.volumes?.map(volume => ({ container: volume.container, mount: volume.mount })) || []);
    }
  }, [egg, setValue]);

  const onSubmit = async (data: EggFormData) => {
    try {
      await onSave(data);
    } catch (error) {
      console.error('Failed to save egg:', error);
    }
  };

  if (!hasPermission(isEdit ? 'egg:manage' : 'egg:manage')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          You don't have permission to {isEdit ? 'edit' : 'create'} eggs.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Basic Information
        </h3>

        {/* Name Field */}
        <Input
          label="Name"
          placeholder="Enter egg name"
          fullWidth
          {...register('name')}
          error={errors.name?.message}
        />

        {/* Description Field */}
        <Input
          label="Description"
          placeholder="Enter egg description (optional)"
          fullWidth
          {...register('description')}
          error={errors.description?.message}
        />

        {/* Image Field */}
        <Input
          label="Docker Image"
          placeholder="nginx:alpine"
          fullWidth
          {...register('image')}
          error={errors.image?.message}
        />
      </div>

      {/* Environment Variables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Environment Variables
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => appendEnvironment({ key: '', value: '' })}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Variable
          </Button>
        </div>

        {environmentFields.length > 0 ? (
          <div className="space-y-3">
            {environmentFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <Input
                  placeholder="KEY"
                  fullWidth
                  {...register(`environment.${index}.key`)}
                  error={errors.environment?.[index]?.key?.message}
                />
                <Input
                  placeholder="value"
                  fullWidth
                  {...register(`environment.${index}.value`)}
                  error={errors.environment?.[index]?.value?.message}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeEnvironment(index)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  className="mt-1"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No environment variables configured.
          </p>
        )}
      </div>

      {/* Ports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Ports
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => appendPort({ container: 80, protocol: 'tcp' })}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Port
          </Button>
        </div>

        {portFields.length > 0 ? (
          <div className="space-y-3">
            {portFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <Input
                  type="number"
                  placeholder="80"
                  fullWidth
                  {...register(`ports.${index}.container`, { valueAsNumber: true })}
                  error={errors.ports?.[index]?.container?.message}
                />
                <select
                  {...register(`ports.${index}.protocol`)}
                  className="px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="tcp">TCP</option>
                  <option value="udp">UDP</option>
                </select>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removePort(index)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  className="mt-1"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No ports configured.
          </p>
        )}
      </div>

      {/* Volumes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Volumes
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => appendVolume({ container: '/app/data', mount: '/data' })}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Volume
          </Button>
        </div>

        {volumeFields.length > 0 ? (
          <div className="space-y-3">
            {volumeFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <Input
                  placeholder="/app/data"
                  fullWidth
                  {...register(`volumes.${index}.container`)}
                  error={errors.volumes?.[index]?.container?.message}
                />
                <Input
                  placeholder="/host/data"
                  fullWidth
                  {...register(`volumes.${index}.mount`)}
                  error={errors.volumes?.[index]?.mount?.message}
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeVolume(index)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  className="mt-1"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No volumes configured.
          </p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end pt-4 space-x-3 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isEdit ? 'Update Egg' : 'Create Egg'}
        </Button>
      </div>
    </form>
  );
};