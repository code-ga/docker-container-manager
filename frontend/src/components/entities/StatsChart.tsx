import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '../../lib/utils';

export interface ChartDataPoint {
  timestamp: string;
  cpu?: number;
  memory?: number;
  disk?: number;
  network?: number;
  [key: string]: string | number | undefined;
}

export interface StatsChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  chartType?: 'line' | 'area';
  metrics?: Array<{
    key: string;
    label: string;
    color: string;
    unit?: string;
  }>;
  className?: string;
  formatTooltipValue?: (value: number, key: string) => string;
  formatXAxisTick?: (value: string) => string;
}

// Default metrics configuration
const defaultMetrics = [
  { key: 'cpu', label: 'CPU Usage', color: '#3b82f6', unit: '%' },
  { key: 'memory', label: 'Memory Usage', color: '#10b981', unit: '%' },
  { key: 'disk', label: 'Disk Usage', color: '#f59e0b', unit: '%' },
];

export const StatsChart: React.FC<StatsChartProps> = ({
  data,
  title,
  height = 300,
  showGrid = true,
  showLegend = true,
  chartType = 'line',
  metrics = defaultMetrics,
  className,
  formatTooltipValue,
  formatXAxisTick,
}) => {
  // Format data for display
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      displayTime: formatXAxisTick
        ? formatXAxisTick(point.timestamp)
        : new Date(point.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
    }));
  }, [data, formatXAxisTick]);

  // Custom tooltip formatter
  const handleTooltipFormat = (value: number, name: string) => {
    if (formatTooltipValue) {
      return [formatTooltipValue(value, name), name];
    }

    const metric = metrics.find(m => m.key === name);
    const unit = metric?.unit || '';
    return [`${value.toFixed(1)}${unit}`, metric?.label || name];
  };

  // Custom tick formatter for X-axis
  const handleXAxisTick = (value: string) => {
    return formatXAxisTick ? formatXAxisTick(value) : value;
  };

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-500 dark:text-gray-400', className)}
           style={{ height }}>
        No data available
      </div>
    );
  }

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;

  return (
    <div className={cn('w-full', className)}>
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
          )}

          <XAxis
            dataKey="displayTime"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={handleXAxisTick}
            stroke="#6b7280"
          />

          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            stroke="#6b7280"
            domain={[0, 100]}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb',
            }}
            formatter={handleTooltipFormat}
            labelStyle={{ color: '#f9fafb' }}
          />

          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
          )}

          {metrics.map((metric) => {
            const Component = chartType === 'area' ? Area : Line;
            return (
              <Component
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2}
                dot={{ fill: metric.color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: metric.color, strokeWidth: 2 }}
                fill={chartType === 'area' ? `${metric.color}20` : undefined}
                fillOpacity={chartType === 'area' ? 0.3 : undefined}
                name={metric.label}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;