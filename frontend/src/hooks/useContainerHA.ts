import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

export interface UseContainerHAOptions {
  containerId: string;
  enabled?: boolean;
}

export interface UseContainerHAReturn {
  migrationStatus: 'idle' | 'migrating' | 'failed' | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
}

export interface MigrationUpdateMessage {
  type: 'migration_update';
  containerId: string;
  status: 'idle' | 'migrating' | 'failed';
  fromNode?: string;
  toNode?: string;
  timestamp: string;
  message?: string;
}

export const useContainerHA = ({
  containerId,
  enabled = true,
}: UseContainerHAOptions): UseContainerHAReturn => {
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'migrating' | 'failed' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectCountRef = useRef(0);

  const handleMigrationUpdate = useCallback((message: MigrationUpdateMessage) => {
    if (message.containerId !== containerId) return;

    setMigrationStatus(message.status);

    // Show toast notification for status changes
    switch (message.status) {
      case 'migrating':
        toast(`Container migration started${message.toNode ? ` to ${message.toNode}` : ''}`, {
          duration: 4000,
        });
        break;
      case 'idle':
        toast.success('Container migration completed successfully', {
          duration: 4000,
        });
        break;
      case 'failed':
        toast.error(`Container migration failed: ${message.message || 'Unknown error'}`, {
          duration: 6000,
        });
        break;
    }
  }, [containerId]);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setIsReconnecting(false);
    setError(null);
    reconnectCountRef.current = 0;

    // Subscribe to migration updates for this container
    if (socketRef.current) {
      socketRef.current.emit('subscribe_migration', { containerId });
    }

    toast.success('Connected to HA updates');
  }, [containerId]);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setError('Disconnected from HA updates');
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('HA Socket error:', error);
    setError(`Connection error: ${error.message}`);
    toast.error(`HA connection error: ${error.message}`);
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
  }, []);

  useEffect(() => {
    if (!enabled || !containerId) return;

    const initSocket = () => {
      const socket = io('/api/ws/ha', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
      });

      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      socket.on('connect_error', handleError);
      socket.on('migration_update', handleMigrationUpdate);

      socketRef.current = socket;
    };

    initSocket();

    return cleanup;
  }, [enabled, containerId, handleConnect, handleDisconnect, handleError, handleMigrationUpdate, cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    migrationStatus,
    isConnected,
    isReconnecting,
    error,
  };
};