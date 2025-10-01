import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { apiEndpoints } from '../lib/api';
import { API_ENDPOINTS } from '../lib/constants';
import type { LogEntry } from '../components/entities/LogViewer';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import type { LogMessage, SubscribeMessage, UnsubscribeMessage } from '../../../backend/src/types/index';

// UUID generator for stdin messages
const generateId = () => Math.random().toString(36).substr(2, 9);

// Stdin result message interface
interface StdinResultMessage {
  type: 'stdin_result';
  status: 'success' | 'error';
  output?: string;
  error?: string;
}

export interface UseContainerLogsOptions {
  containerId: string;
  enabled?: boolean;
  maxLogs?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  fallbackPollingInterval?: number;
}

export interface UseContainerLogsReturn {
  logs: LogEntry[];
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  subscribe: () => void;
  unsubscribe: () => void;
  clearLogs: () => void;
  sendStdin: (input: string) => boolean;
}

export const useContainerLogs = ({
  containerId,
  enabled = true,
  maxLogs = 1000,
  fallbackPollingInterval = 10000,
}: UseContainerLogsOptions): UseContainerLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectCountRef = useRef(0);
  const lastLogIdRef = useRef<string | null>(null);

  const clearLogs = useCallback(() => {
    setLogs([]);
    lastLogIdRef.current = null;
  }, []);

  const addLog = useCallback((logEntry: LogEntry) => {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, logEntry];
      // Keep only the most recent logs
      if (newLogs.length > maxLogs) {
        return newLogs.slice(-maxLogs);
      }
      return newLogs;
    });
    lastLogIdRef.current = logEntry.id;
  }, [maxLogs]);

  const handleLogMessage = useCallback((message: LogMessage) => {
    const logEntry: LogEntry = {
      id: message.timestamp + Math.random().toString(36).substr(2, 9),
      timestamp: message.timestamp,
      level: message.level as LogEntry['level'],
      message: message.message,
    };
    addLog(logEntry);
  }, [addLog]);

  const handleStdinResultMessage = useCallback((message: StdinResultMessage) => {
    const logEntry: LogEntry = {
      id: Date.now() + generateId(),
      timestamp: new Date().toISOString(),
      level: message.status === 'success' ? 'info' : 'error',
      message: message.status === 'success'
        ? `Stdin output: ${message.output || 'Command executed'}`
        : `Stdin error: ${message.error || 'Command failed'}`,
    };
    addLog(logEntry);
  }, [addLog]);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setIsReconnecting(false);
    setError(null);
    reconnectCountRef.current = 0;
    toast.success('Connected to container logs');
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setError('Disconnected from log stream');
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Socket error:', error);
    setError(`Connection error: ${error.message}`);
    toast.error(`Log connection error: ${error.message}`);
  }, []);

  const subscribe = useCallback(() => {
    if (!socketRef.current || !isConnected) return;

    const subscribeMessage: SubscribeMessage = {
      type: 'subscribe',
      containerId,
    };

    socketRef.current.emit('message', subscribeMessage);
    toast.success(`Subscribed to logs for container ${containerId}`);
  }, [containerId, isConnected]);

  const unsubscribe = useCallback(() => {
    if (!socketRef.current || !isConnected) return;

    const unsubscribeMessage: UnsubscribeMessage = {
      type: 'unsubscribe',
      containerId,
    };

    socketRef.current.emit('message', unsubscribeMessage);
    toast.success(`Unsubscribed from logs for container ${containerId}`);
  }, [containerId, isConnected]);

  const sendStdin = useCallback((input: string) => {
    if (!socketRef.current || !isConnected) {
      toast.error('Not connected to container logs');
      return false;
    }

    if (!input.trim()) {
      toast.error('Input cannot be empty');
      return false;
    }

    const stdinMessage = {
      type: 'stdin',
      id: generateId(),
      containerId,
      input: input.trim(),
    };

    socketRef.current.emit('message', stdinMessage);
    return true;
  }, [containerId, isConnected]);


  const startFallbackPolling = useCallback(async () => {
    const pollLogs = async () => {
      try {
        const response = await apiEndpoints.containers.logs(containerId, 50);
        if (response.success && response.data) {
          const logEntries = response.data as LogEntry[];
          if (logEntries.length > 0) {
            setLogs(prevLogs => {
              const newLogs = [...prevLogs, ...logEntries];
              return newLogs.slice(-maxLogs);
            });
          }
        }
      } catch (error) {
        console.error('Fallback polling error:', error);
      }
    };

    // Poll immediately
    await pollLogs();

    // Set up interval
    fallbackIntervalRef.current = setInterval(pollLogs, fallbackPollingInterval);
  }, [containerId, maxLogs, fallbackPollingInterval]);

  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopFallbackPolling();
  }, [stopFallbackPolling]);

  useEffect(() => {
    if (!enabled || !containerId) return;

    const initSocket = () => {
      const socket = io(API_ENDPOINTS.WS_LOGS, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);
      socket.on('log', handleLogMessage);
      socket.on('stdin_result', handleStdinResultMessage);

      socketRef.current = socket;
    };

    initSocket();

    return cleanup;
  }, [enabled, containerId, handleConnect, handleDisconnect, handleError, handleLogMessage, handleStdinResultMessage, cleanup]);

  useEffect(() => {
    if (!isConnected && enabled) {
      // Start fallback polling when not connected
      startFallbackPolling();
    } else {
      // Stop fallback polling when connected
      stopFallbackPolling();
    }

    return stopFallbackPolling;
  }, [isConnected, enabled, startFallbackPolling, stopFallbackPolling]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    logs,
    isConnected,
    isReconnecting,
    error,
    subscribe,
    unsubscribe,
    clearLogs,
    sendStdin,
  };
};