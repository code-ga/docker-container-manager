import React, { useState } from 'react';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabComponentProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
}

export const TabComponent: React.FC<TabComponentProps> = ({
  tabs,
  defaultActiveTab,
  className,
  tabClassName,
  activeTabClassName,
  contentClassName,
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id);

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
              activeTab === tab.id
                ? cn(
                    'bg-blue-600 text-white shadow-sm',
                    activeTabClassName
                  )
                : cn(
                    'text-gray-600 dark:text-gray-400',
                    tabClassName
                  )
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={cn('w-full', contentClassName)}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'transition-opacity duration-200',
              activeTab === tab.id ? 'opacity-100' : 'opacity-0 hidden'
            )}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabComponent;