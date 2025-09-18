// 基础服务类

import type { IService, IEventEmitter, Disposable } from '@lginxai/luckin-types';
import { EventBus } from '../../foundation/events/event-bus';
import { LuckinError, ERROR_CODES } from '@lginxai/luckin-shared';

// 基础服务抽象类
export abstract class BaseService implements IService {
  public readonly id: string;
  public readonly name: string;
  
  protected eventBus = new EventBus();
  protected disposables: Disposable[] = [];
  protected _initialized = false;
  protected _disposed = false;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  // 获取事件发射器
  protected get onDidChangeState(): IEventEmitter {
    return this.eventBus;
  }

  // 初始化服务
  async initialize(): Promise<void> {
    if (this._disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Cannot initialize disposed service: ${this.id}`
      );
    }

    if (this._initialized) {
      return;
    }

    try {
      await this.onInitialize();
      this._initialized = true;
      this.eventBus.emit('initialized', { serviceId: this.id });
    } catch (error) {
      this.eventBus.emit('initializationFailed', { 
        serviceId: this.id, 
        error 
      });
      throw new LuckinError(
        ERROR_CODES.UNKNOWN,
        `Failed to initialize service: ${this.id}`,
        false,
        error as Error
      );
    }
  }

  // 释放服务
  dispose(): void {
    if (this._disposed) {
      return;
    }

    try {
      // 释放所有注册的资源
      this.disposables.forEach(disposable => {
        try {
          disposable.dispose();
        } catch (error) {
          console.error(`Error disposing resource in service ${this.id}:`, error);
        }
      });
      this.disposables = [];

      // 调用子类的清理逻辑
      this.onDispose();

      // 发射服务销毁事件
      this.eventBus.emit('disposed', { serviceId: this.id });
      
      // 释放事件总线
      this.eventBus.dispose();

      this._disposed = true;
      this._initialized = false;
    } catch (error) {
      console.error(`Error disposing service ${this.id}:`, error);
    }
  }

  // 检查服务是否已初始化
  isInitialized(): boolean {
    return this._initialized;
  }

  // 检查服务是否已释放
  isDisposed(): boolean {
    return this._disposed;
  }

  // 注册可释放资源
  protected registerDisposable(disposable: Disposable): void {
    if (this._disposed) {
      disposable.dispose();
      return;
    }
    
    this.disposables.push(disposable);
  }

  // 移除可释放资源
  protected unregisterDisposable(disposable: Disposable): void {
    const index = this.disposables.indexOf(disposable);
    if (index !== -1) {
      this.disposables.splice(index, 1);
    }
  }

  // 发射状态变更事件
  protected emitStateChange<T = any>(eventType: string, payload?: T): void {
    if (!this._disposed) {
      this.eventBus.emit(eventType, payload);
    }
  }

  // 等待初始化完成
  async waitForInitialization(timeout?: number): Promise<void> {
    if (this._initialized) {
      return;
    }

    if (this._disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Service is disposed: ${this.id}`
      );
    }

    await this.eventBus.waitFor('initialized', timeout, (event) => {
      return event.payload?.serviceId === this.id;
    });
  }

  // 获取服务统计信息
  getStats(): {
    id: string;
    name: string;
    initialized: boolean;
    disposed: boolean;
    disposableCount: number;
    eventListenerCount: number;
  } {
    return {
      id: this.id,
      name: this.name,
      initialized: this._initialized,
      disposed: this._disposed,
      disposableCount: this.disposables.length,
      eventListenerCount: this.eventBus.getStats().totalListeners
    };
  }

  // 子类实现的初始化逻辑
  protected abstract onInitialize(): Promise<void> | void;

  // 子类实现的清理逻辑
  protected abstract onDispose(): void;
}

// 异步服务基类
export abstract class AsyncService extends BaseService {
  private initializationPromise?: Promise<void>;

  async initialize(): Promise<void> {
    if (this._disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Cannot initialize disposed service: ${this.id}`
      );
    }

    if (this._initialized) {
      return;
    }

    // 避免重复初始化
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      await this.onInitialize();
      this._initialized = true;
      this.eventBus.emit('initialized', { serviceId: this.id });
    } catch (error) {
      this.eventBus.emit('initializationFailed', { 
        serviceId: this.id, 
        error 
      });
      throw new LuckinError(
        ERROR_CODES.UNKNOWN,
        `Failed to initialize async service: ${this.id}`,
        false,
        error as Error
      );
    } finally {
      this.initializationPromise = undefined;
    }
  }
}

// 可配置服务基类
export abstract class ConfigurableService<T = any> extends BaseService {
  protected _config: T;

  constructor(id: string, name: string, initialConfig: T) {
    super(id, name);
    this._config = { ...initialConfig };
  }

  // 获取配置
  getConfig(): T {
    return { ...this._config };
  }

  // 更新配置
  updateConfig(config: Partial<T>): void {
    if (this._disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Cannot update config of disposed service: ${this.id}`
      );
    }

    const oldConfig = { ...this._config };
    this._config = { ...this._config, ...config };
    
    this.onConfigChanged(oldConfig, this._config);
    this.emitStateChange('configChanged', {
      oldConfig,
      newConfig: this._config,
      changes: config
    });
  }

  // 重置配置
  resetConfig(config: T): void {
    if (this._disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Cannot reset config of disposed service: ${this.id}`
      );
    }

    const oldConfig = { ...this._config };
    this._config = { ...config };
    
    this.onConfigChanged(oldConfig, this._config);
    this.emitStateChange('configReset', {
      oldConfig,
      newConfig: this._config
    });
  }

  // 配置变更回调
  protected abstract onConfigChanged(oldConfig: T, newConfig: T): void;
}

// 服务装饰器
export function Service(id?: string) {
  return function <T extends new (...args: any[]) => BaseService>(constructor: T): T {
    const serviceId = id || constructor.name;
    
    // 可以在这里添加服务注册逻辑
    // 例如：globalContainer.registerType(serviceId, constructor);
    
    // 暂时避免未使用变量警告
    void serviceId;
    
    return constructor;
  };
}