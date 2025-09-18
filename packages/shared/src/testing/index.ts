// 测试工具和模拟对象

import { IStorageAdapter, MemoryStorageAdapter } from '../utils/storage';
import type { 
  IEventEmitter, 
  IService, 
  IConfiguration,
  Disposable 
} from '@lginxai/luckin-types';

// 模拟事件发射器
export class MockEventEmitter<T = any> implements IEventEmitter<T> {
  private listeners = new Map<string, Array<(data: T) => void>>();
  private disposed = false;

  on(event: string, listener: (data: T) => void): Disposable {
    if (this.disposed) {
      throw new Error('EventEmitter is disposed');
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)!.push(listener);
    
    return {
      dispose: () => this.off(event, listener)
    };
  }

  off(event: string, listener: (data: T) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: T): void {
    if (this.disposed) {
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // 创建副本以避免在回调中修改数组时出现问题
      const listeners = [...eventListeners];
      listeners.forEach(listener => {
        try {
          listener(data!);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  once(event: string, listener: (data: T) => void): Disposable {
    const onceListener = (data: T) => {
      listener(data);
      this.off(event, onceListener);
    };
    
    return this.on(event, onceListener);
  }

  dispose(): void {
    this.listeners.clear();
    this.disposed = true;
  }

  // 测试辅助方法
  getListenerCount(event: string): number {
    return this.listeners.get(event)?.length || 0;
  }

  hasListeners(event: string): boolean {
    return this.getListenerCount(event) > 0;
  }

  getAllEvents(): string[] {
    return Array.from(this.listeners.keys());
  }

  clear(): void {
    this.listeners.clear();
  }
}

// 模拟配置服务
export class MockConfiguration implements IConfiguration {
  private data = new Map<string, any>();

  get<T>(key: string, defaultValue?: T): T {
    return this.data.has(key) ? this.data.get(key) : defaultValue as T;
  }

  set<T>(key: string, value: T): void {
    this.data.set(key, value);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }

  remove(key: string): void {
    this.data.delete(key);
  }

  // 测试辅助方法
  clear(): void {
    this.data.clear();
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.data.entries()) {
      result[key] = value;
    }
    return result;
  }

  setAll(data: Record<string, any>): void {
    this.clear();
    for (const [key, value] of Object.entries(data)) {
      this.data.set(key, value);
    }
  }
}

// 模拟服务基类
export abstract class MockService implements IService {
  public readonly id: string;
  public readonly name: string;
  private disposed = false;
  protected initialized = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  async initialize(): Promise<void> {
    if (this.disposed) {
      throw new Error('Service is disposed');
    }
    
    if (this.initialized) {
      return;
    }
    
    await this.onInitialize();
    this.initialized = true;
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    
    this.onDispose();
    this.disposed = true;
    this.initialized = false;
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  protected abstract onInitialize(): Promise<void> | void;
  protected abstract onDispose(): void;
}

// 测试工具类
export class TestUtils {
  // 等待指定时间
  static wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 等待条件满足
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout = 5000,
    interval = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) {
        return;
      }
      await this.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  // 等待事件触发
  static waitForEvent<T>(
    emitter: IEventEmitter<T>,
    event: string,
    timeout = 5000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        disposable.dispose();
        reject(new Error(`Event '${event}' not emitted within ${timeout}ms`));
      }, timeout);

      const disposable = emitter.on(event, (data: any) => {
        clearTimeout(timer);
        disposable.dispose();
        resolve(data);
      });
    });
  }

  // 创建模拟函数
  static createMockFn<T extends (...args: any[]) => any>(): MockFunction<T> {
    const calls: Array<Parameters<T>> = [];
    const results: Array<ReturnType<T> | Error> = [];
    
    const mockFn = ((...args: Parameters<T>): ReturnType<T> => {
      calls.push(args);
      
      try {
        let result: ReturnType<T>;
        
        if (mockFn._implementation) {
          result = mockFn._implementation(...args);
        } else if (mockFn._returnValues.length > 0) {
          const returnValue = mockFn._returnValues.shift();
          if (!returnValue) {
            result = mockFn._defaultReturnValue;
          } else if (returnValue instanceof Error) {
            throw returnValue;
          } else {
            result = returnValue;
          }
        } else {
          result = mockFn._defaultReturnValue;
        }
        
        results.push(result);
        return result;
      } catch (error) {
        results.push(error as Error);
        throw error;
      }
    }) as MockFunction<T>;

    // 添加模拟函数的方法
    mockFn._calls = calls;
    mockFn._results = results;
    mockFn._returnValues = [];
    mockFn._defaultReturnValue = undefined as any;
    mockFn._implementation = undefined;

    mockFn.mockReturnValue = (value: ReturnType<T>) => {
      mockFn._defaultReturnValue = value;
      return mockFn;
    };

    mockFn.mockReturnValueOnce = (value: ReturnType<T>) => {
      mockFn._returnValues.push(value);
      return mockFn;
    };

    mockFn.mockResolvedValue = (value: any) => {
      mockFn._defaultReturnValue = Promise.resolve(value) as ReturnType<T>;
      return mockFn;
    };

    mockFn.mockRejectedValue = (error: any) => {
      mockFn._defaultReturnValue = Promise.reject(error) as ReturnType<T>;
      return mockFn;
    };

    mockFn.mockImplementation = (implementation: T) => {
      mockFn._implementation = implementation;
      return mockFn;
    };

    mockFn.mockImplementationOnce = (implementation: T) => {
      const result = implementation(...([] as any));
      mockFn._returnValues.push(result);
      return mockFn;
    };

    mockFn.mockClear = () => {
      calls.length = 0;
      results.length = 0;
      return mockFn;
    };

    mockFn.mockReset = () => {
      mockFn.mockClear();
      mockFn._returnValues = [];
      mockFn._defaultReturnValue = undefined as any;
      mockFn._implementation = undefined;
      return mockFn;
    };

    return mockFn;
  }

  // 深度克隆对象
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item)) as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }

    return obj;
  }

  // 比较对象是否相等
  static deepEqual(a: any, b: any): boolean {
    if (a === b) {
      return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a !== 'object') {
      return false;
    }

    if (Array.isArray(a) !== Array.isArray(b)) {
      return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) {
      return false;
    }

    for (const key of keysA) {
      if (!keysB.includes(key)) {
        return false;
      }

      if (!this.deepEqual(a[key], b[key])) {
        return false;
      }
    }

    return true;
  }

  // 生成随机字符串
  static randomString(length = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 生成随机数字
  static randomNumber(min = 0, max = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 生成随机布尔值
  static randomBoolean(): boolean {
    return Math.random() < 0.5;
  }
}

// 模拟函数接口
export interface MockFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): ReturnType<T>;
  
  _calls: Array<Parameters<T>>;
  _results: Array<ReturnType<T> | Error>;
  _returnValues: Array<ReturnType<T> | Error>;
  _defaultReturnValue: ReturnType<T>;
  _implementation?: T;
  
  mockReturnValue(value: ReturnType<T>): MockFunction<T>;
  mockReturnValueOnce(value: ReturnType<T>): MockFunction<T>;
  mockResolvedValue(value: any): MockFunction<T>;
  mockRejectedValue(error: any): MockFunction<T>;
  mockImplementation(implementation: T): MockFunction<T>;
  mockImplementationOnce(implementation: T): MockFunction<T>;
  mockClear(): MockFunction<T>;
  mockReset(): MockFunction<T>;
}

// 测试环境设置
export class TestEnvironment {
  private services = new Map<string, IService>();
  private disposables: Disposable[] = [];

  // 注册服务
  registerService<T extends IService>(service: T): T {
    this.services.set(service.id, service);
    this.disposables.push(service);
    return service;
  }

  // 获取服务
  getService<T extends IService>(id: string): T | undefined {
    return this.services.get(id) as T;
  }

  // 初始化所有服务
  async initialize(): Promise<void> {
    for (const service of this.services.values()) {
      await service.initialize?.();
    }
  }

  // 清理环境
  dispose(): void {
    this.disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        console.error('Error disposing resource:', error);
      }
    });
    
    this.services.clear();
    this.disposables = [];
  }

  // 创建隔离的存储
  createIsolatedStorage(): IStorageAdapter {
    return new MemoryStorageAdapter();
  }

  // 创建隔离的配置
  createIsolatedConfiguration(): MockConfiguration {
    return new MockConfiguration();
  }
}

// 断言工具
export class Assert {
  static isTrue(condition: boolean, message?: string): void {
    if (!condition) {
      throw new Error(message || 'Expected condition to be true');
    }
  }

  static isFalse(condition: boolean, message?: string): void {
    if (condition) {
      throw new Error(message || 'Expected condition to be false');
    }
  }

  static isNull(value: any, message?: string): void {
    if (value !== null) {
      throw new Error(message || `Expected value to be null, got ${value}`);
    }
  }

  static isNotNull(value: any, message?: string): void {
    if (value === null) {
      throw new Error(message || 'Expected value to not be null');
    }
  }

  static isUndefined(value: any, message?: string): void {
    if (value !== undefined) {
      throw new Error(message || `Expected value to be undefined, got ${value}`);
    }
  }

  static isNotUndefined(value: any, message?: string): void {
    if (value === undefined) {
      throw new Error(message || 'Expected value to not be undefined');
    }
  }

  static equals<T>(actual: T, expected: T, message?: string): void {
    if (!TestUtils.deepEqual(actual, expected)) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  static notEquals<T>(actual: T, expected: T, message?: string): void {
    if (TestUtils.deepEqual(actual, expected)) {
      throw new Error(
        message || `Expected values to not be equal: ${JSON.stringify(actual)}`
      );
    }
  }

  static throws(fn: () => void, expectedError?: string | RegExp | Error, message?: string): void {
    let thrown = false;
    let actualError: Error | undefined;

    try {
      fn();
    } catch (error) {
      thrown = true;
      actualError = error as Error;
    }

    if (!thrown) {
      throw new Error(message || 'Expected function to throw an error');
    }

    if (expectedError) {
      if (typeof expectedError === 'string') {
        if (actualError!.message !== expectedError) {
          throw new Error(
            message || `Expected error message '${expectedError}', got '${actualError!.message}'`
          );
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(actualError!.message)) {
          throw new Error(
            message || `Expected error message to match ${expectedError}, got '${actualError!.message}'`
          );
        }
      } else if (expectedError instanceof Error) {
        if (actualError!.constructor !== expectedError.constructor) {
          throw new Error(
            message || `Expected error type ${expectedError.constructor.name}, got ${actualError!.constructor.name}`
          );
        }
      }
    }
  }

  static async throwsAsync(
    fn: () => Promise<void>, 
    expectedError?: string | RegExp | Error, 
    message?: string
  ): Promise<void> {
    let thrown = false;
    let actualError: Error | undefined;

    try {
      await fn();
    } catch (error) {
      thrown = true;
      actualError = error as Error;
    }

    if (!thrown) {
      throw new Error(message || 'Expected async function to throw an error');
    }

    if (expectedError) {
      if (typeof expectedError === 'string') {
        if (actualError!.message !== expectedError) {
          throw new Error(
            message || `Expected error message '${expectedError}', got '${actualError!.message}'`
          );
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(actualError!.message)) {
          throw new Error(
            message || `Expected error message to match ${expectedError}, got '${actualError!.message}'`
          );
        }
      } else if (expectedError instanceof Error) {
        if (actualError!.constructor !== expectedError.constructor) {
          throw new Error(
            message || `Expected error type ${expectedError.constructor.name}, got ${actualError!.constructor.name}`
          );
        }
      }
    }
  }
}