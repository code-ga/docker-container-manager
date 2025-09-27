import React from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colorMap = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-600 dark:text-green-400',
    button: 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/40'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    button: 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-600 dark:text-yellow-400',
    button: 'text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/40'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    button: 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40'
  }
};

const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onClose(id), duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        'relative flex items-start p-4 rounded-lg border shadow-lg max-w-sm w-full',
        colors.bg,
        colors.border
      )}
    >
      <div className={cn('flex-shrink-0', colors.icon)}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 ml-3">
        <h4 className={cn('text-sm font-medium', colors.text)}>
          {title}
        </h4>
        {message && (
          <p className={cn('mt-1 text-sm', colors.text, 'opacity-90')}>
            {message}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className={cn(
          'flex-shrink-0 ml-4 p-1 rounded-md transition-colors duration-200',
          colors.button
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// Toast container component
export interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
}

export const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed z-50 space-y-2 top-4 right-4">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={onRemove}
        />
      ))}
    </div>
  );
};

export { Toast };