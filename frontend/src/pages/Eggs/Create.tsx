import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Database, Settings, Network, HardDrive } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EggForm } from '../../components/entities/EggForm';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useCreateEgg, type CreateEggData } from '../../hooks/useEggs';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';

const CreateEgg = () => {
  const navigate = useNavigate();

  // Check permissions
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('eggs:create');

  // Create egg mutation
  const createEggMutation = useCreateEgg();

  const handleSubmit = async (data: any) => {
    if (!canCreate) {
      toast.error('You do not have permission to create eggs');
      return;
    }

    try {
      const eggData: CreateEggData = {
        name: data.name,
        description: data.description,
        image: data.image,
        environment: data.environment ? Object.fromEntries(data.environment.map((env: any) => [env.key, env.value])) : {},
        ports: data.ports?.map((port: any) => ({ container: port.container, protocol: port.protocol })) || [],
        volumes: data.volumes?.map((volume: any) => ({ container: volume.container, mount: volume.mount })) || [],
      };

      await createEggMutation.mutateAsync(eggData);
      navigate('/dashboard/eggs');
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error creating egg:', error);
    }
  };

  if (!canCreate) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Image className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Access Denied
            </h2>
            <p className="text-gray-400">
              You don't have permission to create eggs.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/dashboard/eggs')}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Eggs
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Image className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">
              Create Egg
            </h1>
          </div>
          <p className="text-gray-400">
            Create a new container egg configuration
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
            <div className="p-6 border border-gray-700 rounded-lg bg-gray-800/50">
              <EggForm
                onSave={handleSubmit}
                onCancel={() => navigate('/dashboard/eggs')}
                isLoading={createEggMutation.isPending}
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
            <div className="sticky p-6 border border-gray-700 rounded-lg bg-gray-800/50 top-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Egg Information
              </h3>

              <div className="space-y-4 text-sm">
                {/* Egg Preview */}
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <span className="font-medium text-white">
                      New Egg
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Ready to be created
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-300">Container Template</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-green-500" />
                    <span className="text-gray-300">Environment Variables</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-300">Port Configuration</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-300">Volume Mounting</span>
                  </div>
                </div>

                {/* Configuration Steps */}
                <div className="pt-3 border-t border-gray-700">
                  <h4 className="mb-2 text-sm font-medium text-white">
                    Configuration Steps
                  </h4>
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Basic Information</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Environment Variables</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full" />
                      <span>Ports & Volumes</span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="pt-3 border-t border-gray-700">
                  <h4 className="mb-2 text-sm font-medium text-white">
                    Requirements
                  </h4>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>• Valid Docker image</div>
                    <div>• Unique egg name</div>
                    <div>• Proper port configuration</div>
                    <div>• Valid volume paths</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateEgg;