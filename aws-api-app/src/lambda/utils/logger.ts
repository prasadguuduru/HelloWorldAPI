// Logging utility with structured TypeScript interfaces

import { LogLevel, LogEntry } from '../../types';

/**
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  requestId?: string;
  functionName?: string;
  environment?: string;
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Check if a log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
    };

    return levels[level] >= levels[this.config.level];
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId: this.config.requestId,
      data,
      error: error?.message,
      ...(error?.stack && { stack: error.stack }),
      ...(this.config.functionName && { functionName: this.config.functionName }),
      ...(this.config.environment && { environment: this.config.environment }),
    };
  }

  /**
   * Log a message at the specified level
   */
  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, data, error);
    const logString = JSON.stringify(logEntry);

    // Use appropriate console method based on level
    switch (level) {
      case 'DEBUG':
        console.debug(logString);
        break;
      case 'INFO':
        console.info(logString);
        break;
      case 'WARN':
        console.warn(logString);
        break;
      case 'ERROR':
        console.error(logString);
        break;
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any): void {
    this.log('DEBUG', message, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, data?: any): void {
    this.log('ERROR', message, data, error);
  }

  /**
   * Log request start
   */
  logRequestStart(method: string, path: string, data?: any): void {
    this.info('Request started', {
      method,
      path,
      ...data,
    });
  }

  /**
   * Log request end
   */
  logRequestEnd(method: string, path: string, statusCode: number, duration?: number): void {
    this.info('Request completed', {
      method,
      path,
      statusCode,
      ...(duration && { duration: `${duration}ms` }),
    });
  }

  /**
   * Log Lambda function start
   */
  logLambdaStart(functionName: string, event: any): void {
    this.info('Lambda function started', {
      functionName,
      eventType: event.httpMethod ? 'API Gateway' : 'Unknown',
      httpMethod: event.httpMethod,
      resource: event.resource,
    });
  }

  /**
   * Log Lambda function end
   */
  logLambdaEnd(functionName: string, statusCode?: number, duration?: number): void {
    this.info('Lambda function completed', {
      functionName,
      ...(statusCode && { statusCode }),
      ...(duration && { duration: `${duration}ms` }),
    });
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LoggerConfig>): Logger {
    return new Logger({
      ...this.config,
      ...additionalContext,
    });
  }

  /**
   * Update logger configuration
   */
  updateConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

/**
 * Create a logger instance
 */
export function createLogger(config: Partial<LoggerConfig> = {}): Logger {
  const defaultConfig: LoggerConfig = {
    level: (process.env.LOG_LEVEL as LogLevel) || 'INFO',
    environment: process.env.NODE_ENV || 'development',
    ...config,
  };

  return new Logger(defaultConfig);
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a logger for a specific Lambda function
 */
export function createLambdaLogger(functionName: string, requestId?: string): Logger {
  return createLogger({
    functionName,
    requestId,
  });
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T>,
  logger: Logger,
  operation: string
): Promise<T> {
  const startTime = Date.now();
  logger.debug(`Starting ${operation}`);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.info(`Completed ${operation}`, { duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Failed ${operation}`, error as Error, { duration: `${duration}ms` });
    throw error;
  }
}

/**
 * Log performance metrics
 */
export function logPerformanceMetrics(
  logger: Logger,
  metrics: {
    memoryUsed?: number;
    memoryTotal?: number;
    cpuUsage?: number;
    duration?: number;
  }
): void {
  logger.info('Performance metrics', {
    memory: metrics.memoryUsed && metrics.memoryTotal 
      ? `${Math.round((metrics.memoryUsed / metrics.memoryTotal) * 100)}%`
      : undefined,
    memoryUsedMB: metrics.memoryUsed ? Math.round(metrics.memoryUsed / 1024 / 1024) : undefined,
    cpuUsage: metrics.cpuUsage ? `${Math.round(metrics.cpuUsage * 100)}%` : undefined,
    duration: metrics.duration ? `${metrics.duration}ms` : undefined,
  });
}