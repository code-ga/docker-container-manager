import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from '../lib/auth';
import { useToast } from './useToast';
import { WS_BASE_URL, API_ENDPOINTS } from '../lib/constants';

export interface WebSocketMessage {
  type: 'log' | 'stat';
  data: Record<string, unknown>;
  containerId?: string;
  timestamp?: string;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  messages: WebSocketMessage[];
  subscribe: (containerId: string) => void;
  unsubscribe: (containerId: string) => void;
  connect: () => void;
  disconnect: () => void;
}

export const useWebSocket = (): UseWebSocketReturn => {
  const { data: session } = useSession();
  const { showError, showInfo } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 1000;
  const subscriptionsRef = useRef<Set<string>>(new Set());
  const messageCallbackRef = useRef<((data: Record<string, unknown>) => void) | null>(null);

  const getWebSocketUrl = useCallback(() => {
    // Check if session exists for authentication
    if (!session?.session) {
      showError('Authentication Error', 'No active session');
      return null;
    }

    // For Better Auth, we'll use the session ID as the token
    // The backend should handle session validation via cookies or other means
    const sessionId = session.session.id;

    return `${WS_BASE_URL}${API_ENDPOINTS.WS_LOGS}?sessionId=${encodeURIComponent(sessionId)}`;
  }, [session, showError]);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      // Handle different message types
      if (data.type === 'log' || data.type === 'stat') {
        const message: WebSocketMessage = {
          type: data.type,
          data: data.data,
          containerId: data.containerId,
          timestamp: data.timestamp || new Date().toISOString(),
        };

        setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages

        // Call external callback if provided
        if (messageCallbackRef.current) {
          messageCallbackRef.current(data);
        }
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      showError('WebSocket Error', 'Failed to parse incoming message');
    }
  }, [showError]);

  const handleError = useCallback((error: Event) => {
    console.error('WebSocket error:', error);
    showError('WebSocket Error', 'Connection error occurred');
    setIsConnected(false);
  }, [showError]);

  // Use refs to break circular dependencies
  const connectRef = useRef<(() => void) | null>(null);
  const scheduleReconnectRef = useRef<(() => void) | null>(null);

  const handleClose = useCallback((event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    setIsConnected(false);

    // Attempt to reconnect if not manually closed
    if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
      if (scheduleReconnectRef.current) {
        scheduleReconnectRef.current();
      }
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      30000 // Max 30 seconds
    );

    reconnectAttemptsRef.current++;
    showInfo('Connection Lost', `Reconnecting in ${Math.round(delay / 1000)} seconds...`);

    reconnectTimeoutRef.current = setTimeout(() => {
      if (connectRef.current) {
        connectRef.current();
      }
    }, delay);
  }, [showInfo]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      return;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;

        // Resubscribe to containers after reconnection
        subscriptionsRef.current.forEach(containerId => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            containerId
          }));
        });

        showInfo('Connected', 'WebSocket connection established');
      };

      ws.onmessage = handleMessage;
      ws.onerror = handleError;
      ws.onclose = handleClose;

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      showError('Connection Error', 'Failed to establish WebSocket connection');
      scheduleReconnect();
    }
  }, [getWebSocketUrl, handleMessage, handleError, handleClose, scheduleReconnect, showError, showInfo]);

  // Set up refs after functions are defined
  connectRef.current = connect;
  scheduleReconnectRef.current = scheduleReconnect;

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    subscriptionsRef.current.clear();
  }, []);

  const subscribe = useCallback((containerId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showError('Connection Error', 'WebSocket is not connected');
      return;
    }

    subscriptionsRef.current.add(containerId);

    try {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        containerId
      }));
      showInfo('Subscribed', `Subscribed to container: ${containerId}`);
    } catch (error) {
      console.error('Failed to send subscribe message:', error);
      showError('Subscription Error', 'Failed to subscribe to container');
    }
  }, [showError, showInfo]);

  const unsubscribe = useCallback((containerId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    subscriptionsRef.current.delete(containerId);

    try {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        containerId
      }));
      showInfo('Unsubscribed', `Unsubscribed from container: ${containerId}`);
    } catch (error) {
      console.error('Failed to send unsubscribe message:', error);
      showError('Unsubscription Error', 'Failed to unsubscribe from container');
    }
  }, [showError, showInfo]);


  // Auto-connect when session is available
  useEffect(() => {
    if (session?.session) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    messages,
    subscribe,
    unsubscribe,
    connect,
    disconnect
  };
};