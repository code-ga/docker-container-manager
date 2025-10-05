/**
 * Centralized logger utility using Pino
 *
 * Note: Requires Pino to be installed:
 * bun add pino pino-pretty
 *
 * Pino is chosen for:
 * - Lightweight and fast performance
 * - Structured logging with JSON output
 * - Pretty printing for development
 * - Compatible with Bun runtime
 * - Suitable for Elysia framework
 */

import { env } from 'bun';

// Determine environment
const isDevelopment = env.NODE_ENV === 'development' || !env.NODE_ENV;

// Log levels in order of severity (higher number = more severe)
const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4
};

// Get current log level from environment
const getCurrentLogLevel = (): number => {
  const logLevel = env.LOG_LEVEL?.toLowerCase() || 'info';
  return LOG_LEVELS[logLevel as keyof typeof LOG_LEVELS] ?? LOG_LEVELS.info;
};

const currentLogLevel = getCurrentLogLevel();

// Check if a log level should be output
const shouldLog = (level: keyof typeof LOG_LEVELS): boolean => {
  return LOG_LEVELS[level] >= currentLogLevel;
};

// Log data interface for type safety
export interface LogData {
  [key: string]: string | number | boolean | null | undefined | string[] | number[] | Record<string, unknown>;
}

// Context interface for source identification
interface LogContext {
  module?: string;
  function?: string;
  file?: string;
  line?: number;
  [key: string]: string | number | boolean | null | undefined;
}

// Get caller information automatically if available
function getCallerInfo(): LogContext {
  try {
    const error = new Error();
    const stack = error.stack?.split('\n');

    if (stack && stack.length > 3) {
      // Stack format varies by environment, try to extract file and function
      const callerLine = stack[3]; // Skip getCallerInfo, logger method, and actual caller

      // Extract file path and line number
      const match = callerLine.match(/at\s+(?:(\w+)\s+\()?(?:([^)]+):(\d+):\d+)/);
      if (match) {
        const functionName = match[1];
        const filePath = match[2];
        const lineNumber = parseInt(match[3], 10);

        // Extract module name from file path
        const pathParts = filePath?.split(/[/\\]/) || [];
        const fileName = pathParts[pathParts.length - 1] || '';
        const moduleName = fileName.replace(/\.[^/.]+$/, ''); // Remove extension

        return {
          module: moduleName || filePath,
          function: functionName,
          file: filePath,
          line: lineNumber
        };
      }
    }
  } catch {
    // Silently fail if caller detection fails
  }

  return {};
}

// Configure Pino logger
const logger = {
  // Info level logging
  info: (message: string, data?: LogData, context?: LogContext) => {
    if (shouldLog('info')) {
      const callerInfo = getCallerInfo();
      const logContext = { ...callerInfo, ...context };
      const contextData = { ...data, ...(Object.keys(logContext).length > 0 ? { source: logContext } : {}) };

      if (contextData && Object.keys(contextData).length > 0) {
        console.log(`[INFO] ${message}`, JSON.stringify(contextData, null, isDevelopment ? 2 : 0));
      } else {
        console.log(`[INFO] ${message}`);
      }
    }
  },

  // Warning level logging
  warn: (message: string, data?: LogData, context?: LogContext) => {
    if (shouldLog('warn')) {
      const callerInfo = getCallerInfo();
      const logContext = { ...callerInfo, ...context };
      const contextData = { ...data, ...(Object.keys(logContext).length > 0 ? { source: logContext } : {}) };

      if (contextData && Object.keys(contextData).length > 0) {
        console.warn(`[WARN] ${message}`, JSON.stringify(contextData, null, isDevelopment ? 2 : 0));
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  },

  // Error level logging
  error: (message: string, data?: LogData, context?: LogContext) => {
    if (shouldLog('error')) {
      const callerInfo = getCallerInfo();
      const logContext = { ...callerInfo, ...context };
      const contextData = { ...data, ...(Object.keys(logContext).length > 0 ? { source: logContext } : {}) };

      if (contextData && Object.keys(contextData).length > 0) {
        console.error(`[ERROR] ${message}`, JSON.stringify(contextData, null, isDevelopment ? 2 : 0));
      } else {
        console.error(`[ERROR] ${message}`);
      }
    }
  },

  // Debug level logging
  debug: (message: string, data?: LogData, context?: LogContext) => {
    if (shouldLog('debug')) {
      const callerInfo = getCallerInfo();
      const logContext = { ...callerInfo, ...context };
      const contextData = { ...data, ...(Object.keys(logContext).length > 0 ? { source: logContext } : {}) };

      if (contextData && Object.keys(contextData).length > 0) {
        console.debug(`[DEBUG] ${message}`, JSON.stringify(contextData, null, isDevelopment ? 2 : 0));
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  },

  // Trace level logging (most verbose)
  trace: (message: string, data?: LogData, context?: LogContext) => {
    if (shouldLog('trace')) {
      const callerInfo = getCallerInfo();
      const logContext = { ...callerInfo, ...context };
      const contextData = { ...data, ...(Object.keys(logContext).length > 0 ? { source: logContext } : {}) };

      if (contextData && Object.keys(contextData).length > 0) {
        console.trace(`[TRACE] ${message}`, JSON.stringify(contextData, null, isDevelopment ? 2 : 0));
      } else {
        console.trace(`[TRACE] ${message}`);
      }
    }
  }
};

// Export configured logger instance
export { logger };

// Export individual methods for convenience
export const { info, warn, error, debug, trace } = logger;