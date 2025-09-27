import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
}

export interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  maxHeight?: string;
  autoScroll?: boolean;
}

const LogViewer = ({ logs, className, maxHeight = '400px', autoScroll = true }: LogViewerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warn':
        return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'debug':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-gray-300 bg-gray-500/10 border-gray-500/20';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div
      className={cn(
        'bg-gray-900 rounded-lg border border-gray-700 overflow-hidden',
        className
      )}
    >
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-200">Container Logs</h3>
        <p className="text-xs text-gray-400">{logs.length} entries</p>
      </div>

      <div
        ref={scrollRef}
        className="p-4 space-y-2 overflow-y-auto"
        style={{ maxHeight }}
      >
        <AnimatePresence>
          {logs.map((log, index) => (
            <motion.div
              key={log.id || index}
              className={cn(
                'flex gap-3 p-3 rounded-md border text-sm font-mono',
                getLevelColor(log.level)
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex-shrink-0 text-xs opacity-70">
                {formatTimestamp(log.timestamp)}
              </div>
              <div className="flex-shrink-0 w-12 text-xs font-semibold uppercase opacity-70">
                {log.level}
              </div>
              <div className="flex-1 break-words whitespace-pre-wrap">
                {log.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            <p className="text-sm">No logs available</p>
            <p className="mt-1 text-xs">Logs will appear here when the container is running</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { LogViewer };