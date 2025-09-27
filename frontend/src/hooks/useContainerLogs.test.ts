import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContainerLogs } from './useContainerLogs';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock API endpoints
vi.mock('../lib/api', () => ({
  apiEndpoints: {
    containers: {
      logs: vi.fn(),
    },
  },
}));

describe('useContainerLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() =>
      useContainerLogs({ containerId: 'test-container' })
    );

    expect(result.current.logs).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('provides clearLogs function', () => {
    const { result } = renderHook(() =>
      useContainerLogs({ containerId: 'test-container' })
    );

    act(() => {
      result.current.clearLogs();
    });

    expect(result.current.logs).toEqual([]);
  });

  it('handles enabled=false correctly', () => {
    const { result } = renderHook(() =>
      useContainerLogs({ containerId: 'test-container', enabled: false })
    );

    expect(result.current.logs).toEqual([]);
    expect(result.current.isConnected).toBe(false);
  });

  it('accepts custom options', () => {
    const { result } = renderHook(() =>
      useContainerLogs({
        containerId: 'test-container',
        maxLogs: 500,
        fallbackPollingInterval: 5000,
      })
    );

    expect(result.current.logs).toEqual([]);
  });
});