import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Loader2, Database, Settings, AlertTriangle, Edit, Network, HardDrive } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EggForm } from '../../components/entities/EggForm';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useEgg, useUpdateEgg, type UpdateEggData } from '../../hooks/useEggs';
import { usePermissions } from '../../hooks/usePermissions';
import toast from 'react-hot-toast';
import type { Egg } from '../../hooks/useEntities';

const EditEgg = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Check permissions
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('eggs:update');

  // Fetch egg data
  const { data: eggData, isLoading, error } = useEgg(id || '');
  const egg = eggData as Egg | undefined;

  // Update egg mutation
  const updateEggMutation = useUpdateEgg();

  const handleSubmit = async (data: any) => {
    if (!canUpdate || !id) {
      toast.error('You do not have permission to update eggs');
      return;
    }

    try {
      const updateData: UpdateEggData = {
        name: data.name,
        description: data.description,
        image: data.image,
        environment: data.environment ? Object.fromEntries(data.environment.map((env: any) => [env.key, env.value])) : {},
        ports: data.ports?.map((port: any) => ({ container: port.container, protocol: port.protocol })) || [],
        volumes: data.volumes?.map((volume: any) => ({ container: volume.container, mount: volume.mount })) || [],
      };

      await updateEggMutation.mutateAsync({ id, data: updateData });
      navigate(`/dashboard/eggs/${id}`);
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Error updating egg:', error);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-neon-blue" />
            <p className="text-gray-400">Loading egg details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !egg) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Egg Not Found
            </h2>
            <p className="mb-4 text-gray-400">
              {error?.message || 'The requested egg could not be found.'}
            </p>
            <Button onClick={() => navigate('/dashboard/eggs')}>
              Back to Eggs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!canUpdate) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Edit className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold text-white">
              Access Denied
            </h2>
            <p className="text-gray-400">
              You don't have permission to edit eggs.
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
            onClick={() => navigate(`/dashboard/eggs/${id}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="mb-4"
          >
            Back to Egg
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Image className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-white">
              Edit Egg
            </h1>
          </div>
          <p className="text-gray-400">
            Update egg configuration for {egg.name}
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
                egg={egg}
                onSave={handleSubmit}
                onCancel={() => navigate(`/dashboard/eggs/${id}`)}
                isLoading={updateEggMutation.isPending}
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
                {/* Current Egg Status */}
                <div className="p-3 rounded-lg bg-gray-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium text-white">
                      {egg.name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Image: {egg.image}
                  </p>
                </div>

                {/* Current Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-300">Current Configuration</span>
                  </div>

                  {egg.environment && Object.keys(egg.environment).length > 0 && (
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-green-500" />
                      <span className="text-gray-300">
                        {Object.keys(egg.environment).length} Environment Variables
                      </span>
                    </div>
                  )}

                  {egg.ports && egg.ports.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-300">
                        {egg.ports.length} Ports
                      </span>
                    </div>
                  )}

                  {egg.volumes && egg.volumes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-300">
                        {egg.volumes.length} Volumes
                      </span>
                    </div>
                  )}
                </div>

                {/* Last Updated */}
                <div className="pt-3 border-t border-gray-700">
                  <h4 className="mb-2 text-sm font-medium text-white">
                    Last Updated
                  </h4>
                  <div className="text-xs text-gray-400">
                    {new Date(egg.updatedAt).toLocaleDateString()} at{' '}
                    {new Date(egg.updatedAt).toLocaleTimeString()}
                  </div>
                </div>

                {/* Warning */}
                <div className="pt-3 border-t border-gray-700">
                  <div className="p-3 border rounded-lg bg-yellow-900/20 border-yellow-500/50">
                    <h4 className="mb-2 text-sm font-medium text-yellow-400">
                      Warning
                    </h4>
                    <div className="text-xs text-yellow-200">
                      Changes to this egg will affect all containers created from it.
                      Make sure to test your changes before deploying.
                    </div>
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

export default EditEgg;