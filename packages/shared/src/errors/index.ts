// 错误处理类和工具

import { ERROR_CODES } from '../constants';

// 基础错误类
export class LuckinError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly recoverable: boolean = false,
    public readonly cause?: Error,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'LuckinError';
    
    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, LuckinError);
    }
  }

  // 将错误转换为JSON格式
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      context: this.context,
      stack: this.stack,
      cause: this.cause ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined
    };
  }

  // 从JSON恢复错误对象
  static fromJSON(data: any): LuckinError {
    const error = new LuckinError(
      data.code,
      data.message,
      data.recoverable,
      data.cause ? Object.assign(new Error(data.cause.message), data.cause) : undefined,
      data.context
    );
    
    if (data.stack) {
      error.stack = data.stack;
    }
    
    return error;
  }
}

// 文件系统错误
export class FileSystemError extends LuckinError {
  constructor(
    code: string,
    message: string,
    public readonly path: string,
    recoverable = false,
    cause?: Error
  ) {
    super(code, message, recoverable, cause, { path });
    this.name = 'FileSystemError';
  }

  static fileNotFound(path: string): FileSystemError {
    return new FileSystemError(
      ERROR_CODES.FILE_NOT_FOUND,
      `File not found: ${path}`,
      path,
      false
    );
  }

  static accessDenied(path: string): FileSystemError {
    return new FileSystemError(
      ERROR_CODES.FILE_ACCESS_DENIED,
      `Access denied: ${path}`,
      path,
      false
    );
  }

  static fileTooLarge(path: string, size: number, maxSize: number): FileSystemError {
    return new FileSystemError(
      ERROR_CODES.FILE_TOO_LARGE,
      `File too large: ${path} (${size} bytes, max: ${maxSize} bytes)`,
      path,
      false,
      undefined
    );
  }

  static invalidFormat(path: string, expectedFormat?: string): FileSystemError {
    const message = expectedFormat 
      ? `Invalid file format: ${path}, expected: ${expectedFormat}`
      : `Invalid file format: ${path}`;
      
    return new FileSystemError(
      ERROR_CODES.INVALID_FILE_FORMAT,
      message,
      path,
      false
    );
  }
}

// 网络错误
export class NetworkError extends LuckinError {
  constructor(
    code: string,
    message: string,
    public readonly url?: string,
    public readonly status?: number,
    recoverable = true,
    cause?: Error
  ) {
    super(code, message, recoverable, cause, { url, status });
    this.name = 'NetworkError';
  }

  static timeout(url: string, timeout: number): NetworkError {
    return new NetworkError(
      ERROR_CODES.TIMEOUT,
      `Request timeout: ${url} (${timeout}ms)`,
      url,
      undefined,
      true
    );
  }

  static connectionRefused(url: string): NetworkError {
    return new NetworkError(
      ERROR_CODES.CONNECTION_REFUSED,
      `Connection refused: ${url}`,
      url,
      undefined,
      true
    );
  }

  static httpError(url: string, status: number, statusText?: string): NetworkError {
    const message = statusText 
      ? `HTTP ${status} ${statusText}: ${url}`
      : `HTTP ${status}: ${url}`;
      
    return new NetworkError(
      ERROR_CODES.NETWORK_ERROR,
      message,
      url,
      status,
      status >= 500 // 5xx错误通常是可恢复的
    );
  }
}

// 扩展错误
export class ExtensionError extends LuckinError {
  constructor(
    code: string,
    message: string,
    public readonly extensionId: string,
    recoverable = false,
    cause?: Error
  ) {
    super(code, message, recoverable, cause, { extensionId });
    this.name = 'ExtensionError';
  }

  static notFound(extensionId: string): ExtensionError {
    return new ExtensionError(
      ERROR_CODES.EXTENSION_NOT_FOUND,
      `Extension not found: ${extensionId}`,
      extensionId,
      false
    );
  }

  static loadFailed(extensionId: string, cause?: Error): ExtensionError {
    return new ExtensionError(
      ERROR_CODES.EXTENSION_LOAD_FAILED,
      `Failed to load extension: ${extensionId}`,
      extensionId,
      false,
      cause
    );
  }

  static activationFailed(extensionId: string, cause?: Error): ExtensionError {
    return new ExtensionError(
      ERROR_CODES.EXTENSION_ACTIVATION_FAILED,
      `Failed to activate extension: ${extensionId}`,
      extensionId,
      true, // 激活失败通常可以重试
      cause
    );
  }
}

// 配置错误
export class ConfigurationError extends LuckinError {
  constructor(
    code: string,
    message: string,
    public readonly key?: string,
    public readonly value?: any,
    recoverable = true,
    cause?: Error
  ) {
    super(code, message, recoverable, cause, { key, value });
    this.name = 'ConfigurationError';
  }

  static invalid(key: string, value: any, expectedType?: string): ConfigurationError {
    const message = expectedType
      ? `Invalid configuration value for '${key}': ${JSON.stringify(value)}, expected: ${expectedType}`
      : `Invalid configuration value for '${key}': ${JSON.stringify(value)}`;
      
    return new ConfigurationError(
      ERROR_CODES.INVALID_CONFIGURATION,
      message,
      key,
      value,
      true
    );
  }

  static loadFailed(cause?: Error): ConfigurationError {
    return new ConfigurationError(
      ERROR_CODES.CONFIGURATION_LOAD_FAILED,
      'Failed to load configuration',
      undefined,
      undefined,
      true,
      cause
    );
  }
}

// 主题错误
export class ThemeError extends LuckinError {
  constructor(
    code: string,
    message: string,
    public readonly themeId?: string,
    recoverable = true,
    cause?: Error
  ) {
    super(code, message, recoverable, cause, { themeId });
    this.name = 'ThemeError';
  }

  static notFound(themeId: string): ThemeError {
    return new ThemeError(
      ERROR_CODES.THEME_NOT_FOUND,
      `Theme not found: ${themeId}`,
      themeId,
      false
    );
  }

  static loadFailed(themeId: string, cause?: Error): ThemeError {
    return new ThemeError(
      ERROR_CODES.THEME_LOAD_FAILED,
      `Failed to load theme: ${themeId}`,
      themeId,
      true,
      cause
    );
  }

  static invalidFormat(themeId: string, cause?: Error): ThemeError {
    return new ThemeError(
      ERROR_CODES.INVALID_THEME_FORMAT,
      `Invalid theme format: ${themeId}`,
      themeId,
      false,
      cause
    );
  }
}

// 验证错误
export class ValidationError extends LuckinError {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly value?: any,
    public readonly constraints?: string[]
  ) {
    super(ERROR_CODES.INVALID_ARGUMENT, message, true, undefined, {
      field,
      value,
      constraints
    });
    this.name = 'ValidationError';
  }

  static required(field: string): ValidationError {
    return new ValidationError(
      `Field '${field}' is required`,
      field,
      undefined,
      ['required']
    );
  }

  static type(field: string, value: any, expectedType: string): ValidationError {
    return new ValidationError(
      `Field '${field}' must be of type ${expectedType}, got ${typeof value}`,
      field,
      value,
      [`type:${expectedType}`]
    );
  }

  static range(field: string, value: number, min?: number, max?: number): ValidationError {
    const constraints: string[] = [];
    let message = `Field '${field}' value ${value} is out of range`;
    
    if (min !== undefined) {
      constraints.push(`min:${min}`);
      message += `, minimum: ${min}`;
    }
    
    if (max !== undefined) {
      constraints.push(`max:${max}`);
      message += `, maximum: ${max}`;
    }
    
    return new ValidationError(message, field, value, constraints);
  }

  static pattern(field: string, value: string, pattern: string): ValidationError {
    return new ValidationError(
      `Field '${field}' value '${value}' does not match pattern: ${pattern}`,
      field,
      value,
      [`pattern:${pattern}`]
    );
  }
}

// 错误处理工具
export class ErrorHandler {
  private handlers = new Map<string, (error: LuckinError) => void>();
  private globalHandler?: (error: Error) => void;

  // 注册特定类型的错误处理器
  register(errorCode: string, handler: (error: LuckinError) => void): void {
    this.handlers.set(errorCode, handler);
  }

  // 注册全局错误处理器
  registerGlobal(handler: (error: Error) => void): void {
    this.globalHandler = handler;
  }

  // 处理错误
  handle(error: Error): void {
    if (error instanceof LuckinError) {
      const handler = this.handlers.get(error.code);
      if (handler) {
        try {
          handler(error);
          return;
        } catch (handlerError) {
          console.error('Error handler failed:', handlerError);
        }
      }
    }

    // 回退到全局处理器
    if (this.globalHandler) {
      try {
        this.globalHandler(error);
      } catch (handlerError) {
        console.error('Global error handler failed:', handlerError);
      }
    } else {
      // 默认处理：记录到控制台
      console.error('Unhandled error:', error);
    }
  }

  // 移除错误处理器
  unregister(errorCode: string): void {
    this.handlers.delete(errorCode);
  }

  // 清除所有处理器
  clear(): void {
    this.handlers.clear();
    this.globalHandler = undefined;
  }
}

// 错误工具函数
export const ErrorUtils = {
  // 判断是否为可恢复错误
  isRecoverable(error: Error): boolean {
    if (error instanceof LuckinError) {
      return error.recoverable;
    }
    // 默认认为未知错误是可恢复的
    return true;
  },

  // 提取错误信息
  getMessage(error: Error): string {
    if (error instanceof LuckinError) {
      return error.message;
    }
    return error.message || 'Unknown error';
  },

  // 提取错误代码
  getCode(error: Error): string {
    if (error instanceof LuckinError) {
      return error.code;
    }
    return ERROR_CODES.UNKNOWN;
  },

  // 提取错误上下文
  getContext(error: Error): Record<string, any> | undefined {
    if (error instanceof LuckinError) {
      return error.context;
    }
    return undefined;
  },

  // 包装普通错误为LuckinError
  wrap(error: Error, code?: string, recoverable?: boolean): LuckinError {
    if (error instanceof LuckinError) {
      return error;
    }
    
    return new LuckinError(
      code || ERROR_CODES.UNKNOWN,
      error.message || 'Unknown error',
      recoverable !== undefined ? recoverable : true,
      error
    );
  },

  // 创建错误链
  chain(errors: Error[]): LuckinError {
    if (errors.length === 0) {
      return new LuckinError(ERROR_CODES.UNKNOWN, 'No errors provided');
    }
    
    if (errors.length === 1) {
      return ErrorUtils.wrap(errors[0]);
    }
    
    const messages = errors.map(e => ErrorUtils.getMessage(e));
    const rootError = errors[0];
    
    return new LuckinError(
      ErrorUtils.getCode(rootError),
      `Multiple errors occurred: ${messages.join('; ')}`,
      errors.some(e => ErrorUtils.isRecoverable(e)),
      rootError,
      { errorCount: errors.length, errors: errors.map(e => e.message) }
    );
  },

  // 重试包装器
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    backoff: number = 2
  ): Promise<T> {
    let lastError: Error;
    let currentDelay = delay;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // 如果是不可恢复错误或者已达到最大重试次数，直接抛出
        if (!ErrorUtils.isRecoverable(lastError) || attempt === maxRetries) {
          throw lastError;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
    
    throw lastError!;
  }
};

// 全局错误处理器实例
export const globalErrorHandler = new ErrorHandler();

// 设置全局未捕获异常处理
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    globalErrorHandler.handle(event.error || new Error(event.message));
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    globalErrorHandler.handle(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  });
} else if (typeof process !== 'undefined') {
  process.on('uncaughtException', (error) => {
    globalErrorHandler.handle(error);
  });
  
  process.on('unhandledRejection', (reason) => {
    globalErrorHandler.handle(reason instanceof Error ? reason : new Error(String(reason)));
  });
}