// 依赖注入容器实现

import type { IService, Disposable } from '@lginxai/luckin-types';
import { LuckinError, ERROR_CODES } from '@lginxai/luckin-shared';

// 服务标识符类型
export type ServiceIdentifier<T = any> = string | symbol | (new (...args: any[]) => T);

// 服务工厂函数类型
export type ServiceFactory<T = any> = (container: Container) => T;

// 服务生命周期
export enum ServiceLifetime {
  Transient = 'transient',  // 每次获取都创建新实例
  Singleton = 'singleton',  // 单例模式
  Scoped = 'scoped'        // 作用域内单例
}

// 服务描述符
export interface ServiceDescriptor<T = any> {
  identifier: ServiceIdentifier<T>;
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  dependencies?: ServiceIdentifier[];
}

// 服务注册选项
export interface ServiceRegistrationOptions {
  lifetime?: ServiceLifetime;
  dependencies?: ServiceIdentifier[];
}

// 依赖注入容器
export class Container implements Disposable {
  private services = new Map<ServiceIdentifier, ServiceDescriptor>();
  private instances = new Map<ServiceIdentifier, any>();
  private disposing = false;
  private disposed = false;

  // 注册服务
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    options: ServiceRegistrationOptions = {}
  ): this {
    if (this.disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Cannot register service on disposed container'
      );
    }

    const descriptor: ServiceDescriptor<T> = {
      identifier,
      factory,
      lifetime: options.lifetime || ServiceLifetime.Singleton,
      dependencies: options.dependencies
    };

    this.services.set(identifier, descriptor);
    
    // 如果已有实例且不是单例，清除缓存
    if (descriptor.lifetime !== ServiceLifetime.Singleton && this.instances.has(identifier)) {
      this.instances.delete(identifier);
    }

    return this;
  }

  // 注册类型
  registerType<T>(
    identifier: ServiceIdentifier<T>,
    type: new (...args: any[]) => T,
    options: ServiceRegistrationOptions = {}
  ): this {
    return this.register(
      identifier,
      (container) => {
        const dependencies = options.dependencies || [];
        const resolvedDeps = dependencies.map(dep => container.get(dep));
        return new type(...resolvedDeps);
      },
      options
    );
  }

  // 注册实例
  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): this {
    return this.register(
      identifier,
      () => instance,
      { lifetime: ServiceLifetime.Singleton }
    );
  }

  // 注册服务
  registerService<T extends IService>(service: T): this {
    return this.registerInstance(service.id, service);
  }

  // 获取服务
  get<T>(identifier: ServiceIdentifier<T>): T {
    if (this.disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Cannot get service from disposed container'
      );
    }

    const descriptor = this.services.get(identifier);
    if (!descriptor) {
      throw new LuckinError(
        ERROR_CODES.NOT_FOUND,
        `Service not registered: ${String(identifier)}`
      );
    }

    // 检查循环依赖
    const resolutionStack = new Set<ServiceIdentifier>();
    return this.resolve(descriptor, resolutionStack);
  }

  // 尝试获取服务
  tryGet<T>(identifier: ServiceIdentifier<T>): T | undefined {
    try {
      return this.get(identifier);
    } catch {
      return undefined;
    }
  }

  // 检查服务是否已注册
  has(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier);
  }

  // 移除服务注册
  unregister(identifier: ServiceIdentifier): boolean {
    if (this.disposed) {
      return false;
    }

    const removed = this.services.delete(identifier);
    
    // 清理实例缓存
    const instance = this.instances.get(identifier);
    if (instance) {
      this.instances.delete(identifier);
      
      // 如果实例是可释放的，释放它
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose();
        } catch (error) {
          console.error(`Error disposing service ${String(identifier)}:`, error);
        }
      }
    }

    return removed;
  }

  // 获取所有已注册的服务标识符
  getRegisteredServices(): ServiceIdentifier[] {
    return Array.from(this.services.keys());
  }

  // 获取服务描述符
  getDescriptor(identifier: ServiceIdentifier): ServiceDescriptor | undefined {
    return this.services.get(identifier);
  }

  // 创建子容器
  createChild(): Container {
    const child = new Container();
    
    // 复制父容器的服务注册
    for (const [identifier, descriptor] of this.services.entries()) {
      child.services.set(identifier, { ...descriptor });
    }

    return child;
  }

  // 解析服务
  private resolve<T>(descriptor: ServiceDescriptor<T>, resolutionStack: Set<ServiceIdentifier>): T {
    const { identifier, factory, lifetime } = descriptor;

    // 检查循环依赖
    if (resolutionStack.has(identifier)) {
      const cycle = Array.from(resolutionStack).concat(identifier).map(String).join(' -> ');
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Circular dependency detected: ${cycle}`
      );
    }

    // 单例模式：检查缓存
    if (lifetime === ServiceLifetime.Singleton && this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    // 作用域模式：在当前解析过程中缓存
    if (lifetime === ServiceLifetime.Scoped && this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    // 解析依赖
    resolutionStack.add(identifier);
    
    try {
      const instance = factory(this);
      
      // 缓存实例
      if (lifetime === ServiceLifetime.Singleton || lifetime === ServiceLifetime.Scoped) {
        this.instances.set(identifier, instance);
      }

      return instance;
    } finally {
      resolutionStack.delete(identifier);
    }
  }

  // 释放容器
  dispose(): void {
    if (this.disposed || this.disposing) {
      return;
    }

    this.disposing = true;

    // 释放所有缓存的实例
    for (const [identifier, instance] of this.instances.entries()) {
      if (instance && typeof instance.dispose === 'function') {
        try {
          instance.dispose();
        } catch (error) {
          console.error(`Error disposing service ${String(identifier)}:`, error);
        }
      }
    }

    this.instances.clear();
    this.services.clear();
    this.disposed = true;
    this.disposing = false;
  }

  // 获取统计信息
  getStats(): {
    registeredServices: number;
    cachedInstances: number;
    isDisposed: boolean;
  } {
    return {
      registeredServices: this.services.size,
      cachedInstances: this.instances.size,
      isDisposed: this.disposed
    };
  }
}

// 全局容器实例
export const globalContainer = new Container();

// 装饰器支持
export function Injectable(identifier?: ServiceIdentifier) {
  return function <T extends new (...args: any[]) => any>(constructor: T): T {
    const serviceId = identifier || constructor.name;
    globalContainer.registerType(serviceId, constructor);
    return constructor;
  };
}

export function Inject(identifier: ServiceIdentifier): ParameterDecorator {
  return function (_target: any, _propertyKey: string | symbol | undefined, _parameterIndex: number) {
    // 这里可以存储注入信息，用于后续的依赖解析
    // 在实际应用中，通常会结合 reflect-metadata 来实现
    // For now, we'll skip the metadata operations to avoid build errors
    // const existingTokens = Reflect.getMetadata('design:paramtypes', target) || [];
    // existingTokens[parameterIndex] = identifier;
    // Reflect.defineMetadata('design:paramtypes', existingTokens, target);
    
    // 暂时只是一个占位符，避免未使用参数的错误
    void identifier;
  };
}

// 服务定位器模式的简化接口
export class ServiceLocator {
  private static container = globalContainer;

  static setContainer(container: Container): void {
    this.container = container;
  }

  static get<T>(identifier: ServiceIdentifier<T>): T {
    return this.container.get(identifier);
  }

  static tryGet<T>(identifier: ServiceIdentifier<T>): T | undefined {
    return this.container.tryGet(identifier);
  }

  static has(identifier: ServiceIdentifier): boolean {
    return this.container.has(identifier);
  }
}