import React from 'react';
import { Badge } from './ui/Badge';

interface ActivityItem {
  id: string;
  type: 'container' | 'node' | 'cluster' | 'system';
  action: string;
  target: string;
  timestamp: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

export const RecentActivity: React.FC = () => {
  // Sample activity data - in a real app, this would come from an API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'container',
      action: 'started',
      target: 'web-server-01',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      status: 'success',
    },
    {
      id: '2',
      type: 'node',
      action: 'connected',
      target: 'node-02',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      status: 'success',
    },
    {
      id: '3',
      type: 'container',
      action: 'created',
      target: 'api-gateway-01',
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 minutes ago
      status: 'success',
    },
    {
      id: '4',
      type: 'cluster',
      action: 'scaled',
      target: 'production-cluster',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
      status: 'warning',
    },
    {
      id: '5',
      type: 'container',
      action: 'failed',
      target: 'worker-service-03',
      timestamp: new Date(Date.now() - 58 * 60 * 1000).toISOString(), // 58 minutes ago
      status: 'error',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'container':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg dark:bg-blue-900/30">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        );
      case 'node':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg dark:bg-green-900/30">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
            </svg>
          </div>
        );
      case 'cluster':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg dark:bg-purple-900/30">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-gray-900/30">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-gray-900/30">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-200">Success</Badge>;
      case 'error':
        return <Badge className="text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-200">Error</Badge>;
      case 'warning':
        return <Badge className="text-yellow-800 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200">Warning</Badge>;
      case 'info':
        return <Badge className="text-blue-800 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200">Info</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="p-6 border border-gray-200 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Latest system events and updates
          </p>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex items-start space-x-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0">
                {getActivityIcon(activity.type)}
              </div>
              {index < activities.length - 1 && (
                <div className="w-px h-8 mt-2 bg-gray-200 dark:bg-gray-600"></div>
              )}
            </div>

            {/* Activity content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.target}
                  </p>
                  {getStatusBadge(activity.status)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
              <p className="mt-1 text-xs text-gray-500 capitalize dark:text-gray-400">
                {activity.type} • {activity.action}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="py-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full dark:bg-gray-800">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
        </div>
      )}
    </div>
  );
};