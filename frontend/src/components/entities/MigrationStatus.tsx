import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MigrationStatusProps {
  status: 'idle' | 'migrating' | 'failed';
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  idle: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Idle',
    description: 'Container is running normally'
  },
  migrating: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    label: 'Migrating',
    description: 'Container is being migrated to another node'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Failed',
    description: 'Migration failed - manual intervention required'
  }
};

export const MigrationStatus = ({
  status,
  className,
  showLabel = true,
  size = 'md'
}: MigrationStatusProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <motion.div
      className={cn(
        'flex items-center gap-2 rounded-lg border transition-all duration-200',
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      {status === 'migrating' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Icon className={cn(iconSizes[size], config.color)} />
        </motion.div>
      ) : (
        <Icon className={cn(iconSizes[size], config.color)} />
      )}

      {showLabel && (
        <div className="flex flex-col">
          <span className={cn('font-medium', config.color)}>
            {config.label}
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {config.description}
          </span>
        </div>
      )}
    </motion.div>
  );
};