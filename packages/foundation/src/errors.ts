/**
 * Error Handling System - Centralized error management for Luckin IDE
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { ILuckinError } from './types';
import { ErrorCode } from './types';

/**
 * Base Luckin Error class with enhanced error information
 */
export class LuckinError extends Error implements ILuckinError {
  public readonly code: ErrorCode;
  public readonly recoverable: boolean;
  public readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    options: {
      recoverable?: boolean;
      cause?: Error | undefined;
    } = {}
  ) {
    super(message);
    
    this.name = 'LuckinError';
    this.code = code;
    this.recoverable = options.recoverable ?? false;
    this.cause = options.cause;

    // Maintain proper stack trace for V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LuckinError);
    }
  }

  /**
   * Create a recoverable error
   */
  static recoverable(code: ErrorCode, message: string, cause?: Error): LuckinError {
    return new LuckinError(code, message, { recoverable: true, cause: cause });
  }

  /**
   * Create a fatal error
   */
  static fatal(code: ErrorCode, message: string, cause?: Error): LuckinError {
    return new LuckinError(code, message, { recoverable: false, cause: cause });
  }

  /**
   * Wrap an existing error
   */
  static wrap(error: Error, code: ErrorCode = ErrorCode.Unknown): LuckinError {
    if (error instanceof LuckinError) {
      return error;
    }
    return new LuckinError(code, error.message, { cause: error });
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    return error instanceof LuckinError && error.recoverable;
  }

  /**
   * Get error details as object
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handle(error: Error): void | Promise<void>;
}

/**
 * Global error manager
 */
export class ErrorManager {
  private static instance: ErrorManager;
  private handlers: ErrorHandler[] = [];

  private constructor() {}

  static getInstance(): ErrorManager {
    if (!ErrorManager.instance) {
      ErrorManager.instance = new ErrorManager();
    }
    return ErrorManager.instance;
  }

  /**
   * Register error handler
   */
  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Remove error handler
   */
  removeHandler(handler: ErrorHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  /**
   * Handle error with all registered handlers
   */
  async handle(error: Error): Promise<void> {
    const luckinError = error instanceof LuckinError ? error : LuckinError.wrap(error);
    
    // Log error for debugging
    console.error('Luckin Error:', {
      code: luckinError.code,
      message: luckinError.message,
      recoverable: luckinError.recoverable,
      stack: luckinError.stack,
      cause: luckinError.cause
    });

    // Execute all handlers
    const promises = this.handlers.map(handler => {
      try {
        return Promise.resolve(handler.handle(luckinError));
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }
}

/**
 * Console error handler
 */
export class ConsoleErrorHandler implements ErrorHandler {
  handle(error: Error): void {
    if (error instanceof LuckinError) {
      console.error(`[${error.code}] ${error.message}`);
      if (error.cause) {
        console.error('Caused by:', error.cause);
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

/**
 * Global error handling utilities
 */
export const ErrorUtils = {
  /**
   * Wrap async function with error handling
   */
  async<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    errorCode: ErrorCode = ErrorCode.Unknown
  ): Promise<T> {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        const luckinError = error instanceof LuckinError 
          ? error 
          : new LuckinError(errorCode, error instanceof Error ? error.message : String(error), {
              cause: error instanceof Error ? error : undefined
            });
        
        await ErrorManager.getInstance().handle(luckinError);
        throw luckinError;
      }
    }) as any;
  },

  /**
   * Wrap sync function with error handling
   */
  sync<T extends (...args: any[]) => any>(
    fn: T,
    errorCode: ErrorCode = ErrorCode.Unknown
  ): T {
    return ((...args: Parameters<T>) => {
      try {
        return fn(...args);
      } catch (error) {
        const luckinError = error instanceof LuckinError 
          ? error 
          : new LuckinError(errorCode, error instanceof Error ? error.message : String(error), {
              cause: error instanceof Error ? error : undefined
            });
        
        ErrorManager.getInstance().handle(luckinError);
        throw luckinError;
      }
    }) as T;
  }
};

// Initialize default error handling
ErrorManager.getInstance().addHandler(new ConsoleErrorHandler());

// Export error codes for convenience
export { ErrorCode } from './types';