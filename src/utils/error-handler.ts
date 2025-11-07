/**
 * Error Handler Utilities
 *
 * Centralized error handling patterns to eliminate repetitive try/catch blocks
 * and provide consistent error logging and recovery strategies.
 */

import { Logger } from '../types/index.js';
import { ERROR_MESSAGE_PATTERNS_TYPE_CONFIG, MESSAGE_PATTERNS_TYPE_NETWORK } from './constants.js';

/**
 * Error handling strategy configuration
 */
export interface ErrorHandlingStrategy {
  /** Whether to log the error */
  logError?: boolean;
  /** Whether to re-throw the error */
  rethrow?: boolean;
  /** Custom error message prefix */
  messagePrefix?: string;
  /** Fallback value to return on error */
  fallbackValue?: unknown;
  /** Custom error transformation function */
  transformError?: (error: unknown) => Error;
}

/**
 * Default error handling strategy
 */
const DEFAULT_STRATEGY: Required<ErrorHandlingStrategy> = {
  logError: true,
  rethrow: true,
  messagePrefix: '',
  fallbackValue: undefined,
  transformError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
};

/**
 * Safe async operation wrapper with comprehensive error handling
 *
 * @param operation - The async operation to execute
 * @param context - Context information for logging
 * @param strategy - Error handling strategy
 * @param logger - Logger instance
 * @returns Promise with result or fallback value
 */
export async function safeAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string,
  strategy: ErrorHandlingStrategy = {},
  logger?: Logger
): Promise<T | undefined> {
  const config = { ...DEFAULT_STRATEGY, ...strategy };

  try {
    return await operation();
  } catch (error) {
    const transformedError = config.transformError(error);

    if (config.logError && logger) {
      logger.error(`${config.messagePrefix}${context}`, {
        error: transformedError.message,
        stack: transformedError.stack,
      });
    }

    if (config.rethrow) throw transformedError;
    return config.fallbackValue as T | undefined;
  }
}

/**
 * Safe sync operation wrapper
 *
 * @param operation - The sync operation to execute
 * @param context - Context information for logging
 * @param strategy - Error handling strategy
 * @param logger - Logger instance
 * @returns Result or fallback value
 */
export function safeSyncOperation<T>(
  operation: () => T,
  context: string,
  strategy: ErrorHandlingStrategy = {},
  logger?: Logger
): T | undefined {
  const config = { ...DEFAULT_STRATEGY, ...strategy };

  try {
    return operation();
  } catch (error) {
    const transformedError = config.transformError(error);

    if (config.logError && logger) {
      logger.error(`${config.messagePrefix}${context}`, {
        error: transformedError.message,
        stack: transformedError.stack,
      });
    }

    if (config.rethrow) throw transformedError;
    return config.fallbackValue as T | undefined;
  }
}

/**
 * Validation wrapper that provides clear error messages
 *
 * @param value - Value to validate
 * @param validator - Validation function
 * @param errorMessage - Error message if validation fails
 * @returns Validated value
 */
export function validateOrThrow<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  errorMessage: string
): T {
  if (!validator(value)) throw new Error(errorMessage);
  return value;
}

/**
 * Validation wrapper that returns undefined on failure
 *
 * @param value - Value to validate
 * @param validator - Validation function
 * @param logger - Optional logger for warnings
 * @param context - Context for logging
 * @returns Validated value or undefined
 */
export function validateOrUndefined<T>(
  value: unknown,
  validator: (value: unknown) => value is T,
  logger?: Logger,
  context?: string
): T | undefined {
  if (!validator(value)) {
    if (logger && context) {
      logger.warn(`Validation failed: ${context}`, { value });
    }
    return;
  }
  return value;
}

/**
 * Create a retry wrapper for operations that might fail temporarily
 *
 * @param operation - Operation to retry
 * @param maxRetries - Maximum number of retries
 * @param delayMs - Delay between retries in milliseconds
 * @param logger - Logger for retry attempts
 * @returns Promise with operation result
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  logger?: Logger
): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      if (logger) {
        logger.warn(`Operation failed, retrying (${attempt}/${maxRetries})`, {
          error: lastError.message,
          nextRetryIn: delayMs,
        });
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // eslint-disable-next-line no-throw-literal
  throw lastError!;
}

/**
 * Common error types for better error handling
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Error classification utility
 */
export function classifyError(error: unknown): {
  type: 'validation' | 'configuration' | 'network' | 'unknown';
  message: string;
  isRetryable: boolean;
} {
  if (error instanceof ValidationError) {
    return { type: 'validation', message: error.message, isRetryable: false };
  }

  if (error instanceof ConfigurationError) {
    return { type: 'configuration', message: error.message, isRetryable: false };
  }

  if (error instanceof NetworkError) {
    return { type: 'network', message: error.message, isRetryable: true };
  }

  const message = error instanceof Error ? error.message : String(error);

  // Classify based on message patterns
  if (MESSAGE_PATTERNS_TYPE_NETWORK.some(pattern => message.includes(pattern))) {
    return { type: 'network', message, isRetryable: true };
  }

  if (ERROR_MESSAGE_PATTERNS_TYPE_CONFIG.some(pattern => message.includes(pattern))) {
    return { type: 'configuration', message, isRetryable: false };
  }
  return { type: 'unknown', message, isRetryable: false };
}
