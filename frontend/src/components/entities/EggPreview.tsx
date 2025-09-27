import { useState } from 'react';
import { motion } from 'framer-motion';
import { Image, Plus, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { FormBuilder } from '../data/FormBuilder';
import type { FormField } from '../data/FormBuilder';
import { cn } from '../../lib/utils';

export interface Egg {
  id: string;
  name: string;
  image: string;
  startupCommand?: string;
  envVars: Record<string, string>;
  config: Record<string, unknown>;
  description?: string;
}

export interface EggPreviewProps {
  egg: Egg;
  onCreateContainer?: (eggId: string, data: Record<string, unknown>) => void;
  className?: string;
}

const EggPreview = ({ egg, onCreateContainer, className }: EggPreviewProps) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateContainer = async (data: Record<string, unknown>) => {
    if (onCreateContainer) {
      await onCreateContainer(egg.id, data);
      setIsCreateModalOpen(false);
    }
  };

  const createFields: FormField[] = [
    {
      name: 'name',
      label: 'Container Name',
      type: 'text',
      required: true,
      placeholder: 'Enter container name'
    },
    {
      name: 'cpuLimit',
      label: 'CPU Limit (cores)',
      type: 'number',
      required: false,
      placeholder: '1.0'
    },
    {
      name: 'memoryLimit',
      label: 'Memory Limit (MB)',
      type: 'number',
      required: false,
      placeholder: '512'
    },
    {
      name: 'environment',
      label: 'Environment Variables (JSON)',
      type: 'json',
      required: false,
      placeholder: '{}'
    }
  ];

  const configPreview = JSON.stringify(egg.config, null, 2);
  const envPreview = JSON.stringify(egg.envVars, null, 2);

  return (
    <>
      <motion.div
        className={cn(
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200',
          className
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neon-blue/10">
              <Image className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {egg.name}
              </h3>
              <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                {egg.image}
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Container
          </Button>
        </div>

        {egg.description && (
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {egg.description}
          </p>
        )}

        <div className="space-y-4">
          {egg.startupCommand && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Code className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Startup Command
                </span>
              </div>
              <div className="p-3 bg-gray-100 rounded-md dark:bg-gray-700">
                <code className="font-mono text-sm text-gray-800 dark:text-gray-200">
                  {egg.startupCommand}
                </code>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Environment
                </span>
              </div>
              <div className="p-3 overflow-y-auto bg-gray-100 rounded-md dark:bg-gray-700 max-h-32">
                <pre className="font-mono text-xs text-gray-800 dark:text-gray-200">
                  {envPreview}
                </pre>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Configuration
                </span>
              </div>
              <div className="p-3 overflow-y-auto bg-gray-100 rounded-md dark:bg-gray-700 max-h-32">
                <pre className="font-mono text-xs text-gray-800 dark:text-gray-200">
                  {configPreview}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`Create Container from ${egg.name}`}
        description="Configure your new container"
        size="lg"
      >
        <FormBuilder
          fields={createFields}
          onSubmit={handleCreateContainer}
          submitLabel="Create Container"
        />
      </Modal>
    </>
  );
};

export { EggPreview };