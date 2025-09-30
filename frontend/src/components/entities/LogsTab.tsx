import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Terminal,
  Send,
  CheckCircle,
  Search,
  Scroll,
  Play,
  Pause,
  X,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { LogViewer, type LogEntry } from './LogViewer';
import { useWebSocket } from '../../hooks/useWebSocket';
import toast from 'react-hot-toast';

interface LogsTabProps {
  containerId: string;
  containerStatus: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
}

const LogsTab = ({ containerId, containerStatus }: LogsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [localLogs, setLocalLogs] = useState<LogEntry[]>([]);

  // Use WebSocket hook for real-time logs
  const { isConnected, messages, subscribe, unsubscribe } = useWebSocket();

  // Subscribe to container logs on mount
  useEffect(() => {
    if (containerId) {
      subscribe(containerId);
    }

    return () => {
      if (containerId) {
        unsubscribe(containerId);
      }
    };
  }, [containerId, subscribe, unsubscribe]);

  useEffect(() => {
    const newLogs: LogEntry[] = messages
      .filter(msg => msg.containerId === containerId && msg.type === 'log')
      .map(msg => ({
        id: `${msg.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: msg.timestamp || new Date().toISOString(),
        level: (msg.data.level as LogEntry['level']) || 'info',
        message: msg.data.message as string || JSON.stringify(msg.data)
      }));

    if (newLogs.length > 0) {
      setLocalLogs(prev => {
        const combined = [...prev, ...newLogs];
        return combined.slice(-1000); // Keep last 1000 logs
      });
    }
  }, [messages, containerId]);

  // Filter logs based on search term and level
  const filteredLogs = useMemo(() => {
    return localLogs.filter(log => {
      const matchesSearch = searchTerm === '' ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.level.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;

      return matchesSearch && matchesLevel;
    });
  }, [localLogs, searchTerm, logLevelFilter]);

  const handleSendStdin = (input: string) => {
    if (!input.trim()) {
      toast.error('Please enter some input to send');
      return false;
    }

    // For now, we'll simulate stdin sending
    // In a real implementation, this would use the WebSocket to send stdin
    toast.success('Input sent to container');
    return true;
  };

  const clearLogs = () => {
    setLocalLogs([]);
    toast.success('Logs cleared');
  };

  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600 dark:text-green-400">Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
        <span className="text-xs text-gray-400">Disconnected</span>
      </div>
    );
  };

  const logLevelOptions = [
    { value: 'all', label: 'All Levels' },
    { value: 'error', label: 'Errors' },
    { value: 'warn', label: 'Warnings' },
    { value: 'info', label: 'Info' },
    { value: 'debug', label: 'Debug' }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Controls Section */}
      <motion.div
        className="p-4 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Search and Filter */}
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute text-gray-400 transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              value={logLevelFilter}
              onChange={(e) => setLogLevelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {logLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Auto-scroll toggle */}
            <Button
              variant={autoScroll ? "primary" : "secondary"}
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              leftIcon={<Scroll className="w-4 h-4" />}
            >
              Auto-scroll
            </Button>

            {/* Follow toggle */}
            <Button
              variant={isFollowing ? "primary" : "secondary"}
              size="sm"
              onClick={() => setIsFollowing(!isFollowing)}
              leftIcon={isFollowing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            >
              {isFollowing ? 'Pause' : 'Follow'}
            </Button>

            {/* Clear logs */}
            <Button
              variant="secondary"
              size="sm"
              onClick={clearLogs}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>{filteredLogs.length} of {localLogs.length} logs</span>
            {getConnectionStatus()}
          </div>
        </div>
      </motion.div>

      {/* Logs Viewer */}
      <motion.div
        className="flex-1 min-h-0 p-4 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Container Logs
          </h3>
        </div>

        <div className="h-full p-4 overflow-hidden bg-gray-900 rounded-lg">
          <LogViewer
            logs={filteredLogs}
            maxHeight="100%"
            autoScroll={autoScroll && isFollowing}
            className="h-full"
          />
        </div>
      </motion.div>

      {/* Stdin Input Section - Only show for running containers */}
      {containerStatus === 'running' && (
        <motion.div
          className="p-4 bg-white border border-gray-200 shadow-lg dark:bg-gray-800 rounded-xl dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-5 h-5 text-neon-blue" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Send Input
            </h3>
          </div>

          <StdinInput onSend={handleSendStdin} disabled={!isConnected} />
        </motion.div>
      )}
    </div>
  );
};

// Separate component for stdin input to keep LogsTab clean
interface StdinInputProps {
  onSend: (input: string) => boolean;
  disabled: boolean;
}

const StdinInput = ({ onSend, disabled }: StdinInputProps) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const success = onSend(input);
    if (success) {
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Command Input
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter commands to send to the container... (Ctrl+Enter to send)"
          className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 transition-all duration-200 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neon-blue focus:border-neon-blue dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 resize-vertical"
          rows={4}
          disabled={disabled}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {disabled ? (
            <span className="flex items-center gap-1 text-gray-400">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              Waiting for connection...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Ready to send input (Ctrl+Enter)
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSubmit}
          leftIcon={<Send className="w-4 h-4" />}
          disabled={disabled || !input.trim()}
        >
          Send Input
        </Button>
      </div>
    </div>
  );
};

export { LogsTab };