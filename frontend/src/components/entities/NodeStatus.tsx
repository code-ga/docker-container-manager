import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface NodeStatusProps {
  status: 'online' | 'offline' | 'maintenance';
  className?: string;
  showLabel?: boolean;
}

const NodeStatus = ({ status, className, showLabel = true }: NodeStatusProps) => {
  const statusConfig = {
    online: {
      color: 'bg-green-500',
      shadow: 'shadow-green-500/50',
      label: 'Online'
    },
    offline: {
      color: 'bg-gray-500',
      shadow: 'shadow-gray-500/50',
      label: 'Offline'
    },
    maintenance: {
      color: 'bg-yellow-500',
      shadow: 'shadow-yellow-500/50',
      label: 'Maintenance'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.div
        className={cn(
          'w-3 h-3 rounded-full',
          config.color,
          config.shadow,
          'shadow-lg'
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {config.label}
        </span>
      )}
    </div>
  );
};

export { NodeStatus };