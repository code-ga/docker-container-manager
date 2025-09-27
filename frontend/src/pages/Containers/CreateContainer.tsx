import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Server, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormBuilder, type FormField } from '../../components/data/FormBuilder';
import { apiEndpoints } from '../../lib/api';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface Cluster {
  id: string;
  name: string;
  description?: string;
}

interface Egg {
  id: string;
  name: string;
  description?: string;
}

interface CreateContainerFormData {
  name: string;
  eggId: string;
  environment: Record<string, string>;
  cpuLimit: number;
  memoryLimit: number;
  diskLimit: number;
  ports: Record<string, number>;
  enableHA: boolean;
  preferredClusterId?: string;
}

const CreateContainer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [formData, setFormData] = useState<CreateContainerFormData>({
    name: '',
    eggId: '',
    environment: {},
    cpuLimit: 1,
    memoryLimit: 512,
    diskLimit: 1024,
    ports: {},
    enableHA: false,
    preferredClusterId: ''
  });

  // Fetch clusters and eggs on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clustersResponse, eggsResponse] = await Promise.all([
          apiEndpoints.clusters.list(),
          apiEndpoints.eggs.list()
        ]);

        if (clustersResponse.success) {
          setClusters(clustersResponse.data as Cluster[]);
        }

        if (eggsResponse.success) {
          setEggs(eggsResponse.data as Egg[]);
        }
      } catch (error) {
        toast.error('Failed to load data');
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const containerData = {
        ...data,
        type: formData.enableHA ? 'ha' : 'standard',
        preferredClusterId: formData.enableHA ? formData.preferredClusterId : undefined
      };

      const response = await apiEndpoints.containers.create(containerData);

      if (response.success) {
        toast.success('Container created successfully!');
        navigate('/dashboard/containers');
      } else {
        toast.error(response.message || 'Failed to create container');
      }
    } catch (error) {
      toast.error('Failed to create container');
      console.error('Error creating container:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHAToggle = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      enableHA: enabled,
      preferredClusterId: enabled ? prev.preferredClusterId : ''
    }));
  };

  const handleClusterSelect = (clusterId: string) => {
    setFormData(prev => ({
      ...prev,
      preferredClusterId: clusterId
    }));
  };

  const baseFields: FormField[] = [
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
    },
    {
      name: 'environment',
      label: 'Environment Variables',
      type: 'json',
      required: false,
      placeholder: 'Enter environment variables as JSON'
    },
    {
      name: 'ports',
      label: 'Port Mappings',
      type: 'json',
      required: false,
      placeholder: 'Enter port mappings as JSON'
    }
  ];

  const haFields: FormField[] = formData.enableHA ? [
    {
      name: 'preferredClusterId',
      label: 'Preferred Cluster',
      type: 'select',
      required: true,
      placeholder: 'Select a cluster for HA deployment',
      options: clusters.map(cluster => cluster.name)
    }
  ] : [];

  const allFields = [...baseFields, ...haFields];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container px-4 py-8 mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/dashboard/containers')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Containers
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Server className="w-8 h-8 text-neon-blue" />
            <h1 className="text-3xl font-bold text-white">Create Container</h1>
          </div>
          <p className="text-gray-400">
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
            <div className="p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700">
              {/* HA Toggle */}
              <div className="p-4 mb-6 border rounded-lg bg-gradient-to-r from-neon-blue/10 to-neon-purple/10 border-neon-blue/20">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-neon-blue" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    High Availability
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.enableHA}
                      onChange={(e) => handleHAToggle(e.target.checked)}
                      className="w-4 h-4 bg-gray-100 border-gray-300 rounded text-neon-blue focus:ring-neon-blue focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable High Availability
                    </span>
                  </label>
                </div>

                {formData.enableHA && (
                  <motion.div
                    className="mt-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      Select a cluster for high availability deployment. The container will be automatically migrated between nodes for optimal performance and reliability.
                    </p>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {clusters.map((cluster) => (
                        <motion.div
                          key={cluster.id}
                          className={cn(
                            'p-3 rounded-lg border cursor-pointer transition-all duration-200',
                            formData.preferredClusterId === cluster.id
                              ? 'border-neon-blue bg-neon-blue/10 shadow-neon'
                              : 'border-gray-200 dark:border-gray-600 hover:border-neon-blue/50'
                          )}
                          onClick={() => handleClusterSelect(cluster.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {cluster.name}
                              </h4>
                              {cluster.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {cluster.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Form */}
              <FormBuilder
                fields={allFields}
                onSubmit={handleSubmit}
                submitLabel="Create Container"
                isLoading={isLoading}
                className="space-y-4"
              />
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="sticky p-6 bg-white border border-gray-200 shadow-xl dark:bg-gray-800 rounded-xl dark:border-gray-700 top-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Configuration Preview
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Type:</span>
                  <span className={cn(
                    'font-medium',
                    formData.enableHA ? 'text-neon-blue' : 'text-gray-900 dark:text-white'
                  )}>
                    {formData.enableHA ? 'High Availability' : 'Standard'}
                  </span>
                </div>

                {formData.enableHA && formData.preferredClusterId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cluster:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {clusters.find(c => c.id === formData.preferredClusterId)?.name || 'Unknown'}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">CPU:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.cpuLimit} cores
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Memory:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.memoryLimit} MB
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Disk:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formData.diskLimit} MB
                  </span>
                </div>
              </div>

              {formData.enableHA && (
                <motion.div
                  className="p-3 mt-4 border rounded-lg bg-neon-blue/10 border-neon-blue/20"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 text-neon-blue">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">HA Enabled</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Automatic failover and load balancing across cluster nodes
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateContainer;