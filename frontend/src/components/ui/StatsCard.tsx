import React from 'react';
import { Badge } from './Badge';
import { cn } from '../../lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  status?: 'online' | 'offline' | 'warning' | 'healthy';
  icon?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  status,
  icon,
  className,
  loading = false,
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    }
  };

  const getChangeColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse",
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="w-24 h-4 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="w-8 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
        <div className="mt-4">
          <div className="w-16 h-8 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="w-20 h-3 mt-2 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200",
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        {icon && (
          <div className="text-gray-400 dark:text-gray-500">
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline mt-4">
        <p className="text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {status && (
          <Badge className={cn("ml-3", getStatusColor(status))}>
            {status}
          </Badge>
        )}
      </div>

      {change && (
        <p className={cn(
          "mt-2 text-sm",
          getChangeColor(changeType)
        )}>
          {change}
        </p>
      )}
    </div>
  );
};