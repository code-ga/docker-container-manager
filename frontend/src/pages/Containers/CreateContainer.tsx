import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Plus, X, Cpu, HardDrive, Database } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormBuilder, type FormField } from '../../components/data/FormBuilder';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useEggs, useNodes, type Egg } from '../../hooks/useEntities';
import { useCreateContainer, type CreateContainerData } from '../../hooks/useContainers';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface EnvironmentVar {
  key: string;
  value: string;
}

const CreateContainer = () => {
  const navigate = useNavigate();
  const [selectedEgg, setSelectedEgg] = useState<Egg | null>(null);
  const [environmentVars, setEnvironmentVars] = useState<EnvironmentVar[]>([
    { key: '', value: '' }
  ]);

  // Check permissions - simplified for now, assuming admin access
  const hasPermission = true; // TODO: Implement proper permission checking

  // Fetch data
  const { data: eggsData } = useEggs();
  const eggs = eggsData?.eggs || [];
  const { data: nodesData } = useNodes();
  const nodes = nodesData?.nodes || [];

  // Create container mutation
  const createContainerMutation = useCreateContainer();

  // Add new environment variable
  const addEnvironmentVar = () => {
    setEnvironmentVars([...environmentVars, { key: '', value: '' }]);
  };

  // Remove environment variable
  const removeEnvironmentVar = (index: number) => {
    setEnvironmentVars(environmentVars.filter((_, i) => i !== index));
  };

  // Update environment variable
  const updateEnvironmentVar = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...environmentVars];
    updated[index][field] = value;
    setEnvironmentVars(updated);
  };

  // Convert environment vars to record
  const getEnvironmentRecord = (): Record<string, string> => {
    return environmentVars.reduce((acc, env) => {
      if (env.key.trim()) {
        acc[env.key.trim()] = env.value;
      }
      return acc;
    }, {} as Record<string, string>);
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!hasPermission) {
      toast.error('You do not have permission to create containers');
      return;
    }

    try {
      const containerData: CreateContainerData = {
        name: data.name as string,
        eggId: data.eggId as string,
        nodeId: (data.nodeIds as string[])[0] || nodes[0]?.id || '', // Use first selected node or first available
        environment: getEnvironmentRecord(),
        resources: {
          cpu: data.cpuLimit as number,
          memory: `${data.memoryLimit}MB`,
          disk: `${data.diskLimit}MB`
        }
      };

      await createContainerMutation.mutateAsync(containerData);
      navigate('/containers');
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error creating container:', error);
    }
  };

  const fields: FormField[] = [
    {
      name: 'name',
      label: 'Container Name',
      type: 'text',
      required: true,
      placeholder: 'my-awesome-container'
    },
    {
      name: 'eggId',
      label: 'Egg Configuration',
      type: 'select',
      required: true,
      placeholder: 'Select an egg configuration',
      options: eggs.map(egg => egg.name)
    },
    {
      name: 'nodeIds',
      label: 'Node Assignment',
      type: 'select',
      required: true,
      placeholder: 'Select nodes',
      options: nodes.map(node => node.name)
    },
    {
      name: 'cpuLimit',
      label: 'CPU Limit (cores)',
      type: 'number',
      required: true,
      placeholder: '1',
      validation: { min: 0.1, max: 32 }
    },
    {
      name: 'memoryLimit',
      label: 'Memory Limit (MB)',
      type: 'number',
      required: true,
      placeholder: '512',
      validation: { min: 64, max: 65536 }
    },
    {
      name: 'diskLimit',
      label: 'Disk Limit (MB)',
      type: 'number',
      required: true,
      placeholder: '1024',
      validation: { min: 100, max: 1048576 }
    }
  ];

  // Update selected egg when eggId changes
  useEffect(() => {
    const egg = eggs.find(egg => egg.name === selectedEgg?.name);
    if (egg) {
      setSelectedEgg(egg);
    }
  }, [eggs, selectedEgg?.name]);

  if (!hasPermission) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Access Denied
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to create containers.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/containers')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Containers
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Server className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Container
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Deploy a new container with your chosen configuration
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <FormBuilder
                fields={fields}
                onSubmit={handleSubmit}
                submitLabel="Create Container"
                isLoading={createContainerMutation.isPending}
                className="space-y-6"
              />

              {/* Environment Variables Section */}
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Environment Variables
                  </h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addEnvironmentVar}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Variable
                  </Button>
                </div>

                <div className="space-y-3">
                  {environmentVars.map((env, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Variable name"
                        value={env.key}
                        onChange={(e) => updateEnvironmentVar(index, 'key', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={env.value}
                        onChange={(e) => updateEnvironmentVar(index, 'value', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => removeEnvironmentVar(index)}
                        leftIcon={<X className="w-4 h-4" />}
                        className="px-3"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/containers')}
                  disabled={createContainerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  isLoading={createContainerMutation.isPending}
                  disabled={createContainerMutation.isPending}
                  onClick={() => {
                    // Trigger form submission programmatically
                    const form = document.querySelector('form');
                    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                  }}
                >
                  Create Container
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="sticky p-6 bg-white border border-gray-200 rounded-lg shadow-sm top-6 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Configuration Preview
              </h3>

              <div className="space-y-4 text-sm">
                {/* Selected Egg Preview */}
                {selectedEgg && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Server className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedEgg.name}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-600 dark:text-gray-400">
                      {selectedEgg.image}
                    </p>
                  </div>
                )}

                {/* Resources Preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">CPU:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fields.find(f => f.name === 'cpuLimit')?.validation?.min || 1} cores
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fields.find(f => f.name === 'memoryLimit')?.validation?.min || 512} MB
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Disk:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {fields.find(f => f.name === 'diskLimit')?.validation?.min || 1024} MB
                    </span>
                  </div>
                </div>

                {/* Environment Variables Preview */}
                {environmentVars.some(env => env.key.trim()) && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Environment Variables
                    </h4>
                    <div className="space-y-1">
                      {environmentVars
                        .filter(env => env.key.trim())
                        .map((env, index) => (
                          <div key={index} className="font-mono text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              {env.key}
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">=</span>
                            <span className="text-gray-900 dark:text-white">
                              {env.value}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Selected Nodes Preview */}
                {nodes.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
                      Available Nodes
                    </h4>
                    <div className="space-y-1">
                      {nodes.slice(0, 3).map((node, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div className={cn(
                            'w-2 h-2 rounded-full',
                            'bg-green-500'
                          )} />
                          <span className="text-gray-900 dark:text-white">
                            {node.name}
                          </span>
                        </div>
                      ))}
                      {nodes.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{nodes.length - 3} more nodes
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateContainer;