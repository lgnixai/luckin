/**
 * Dependency Injection System - Advanced DI container for Luckin IDE
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Disposable,
  ServiceIdentifier, 
  ServiceFactory, 
  ServiceDescriptor,
  IServiceContainer,
  IService 
} from './types';
import { ServiceLifetime } from './types';
import { LuckinError, ErrorCode } from './errors';

/**
 * Service registration options
 */
export interface ServiceOptions {
  lifetime?: ServiceLifetime;
  dependencies?: ServiceIdentifier[];
  tags?: string[];
}

/**
 * Service container implementation with advanced features
 */
export class ServiceContainer implements IServiceContainer {
  private _services = new Map<ServiceIdentifier, ServiceDescriptor>();
  private _instances = new Map<ServiceIdentifier, any>();
  private _disposables = new Map<ServiceIdentifier, Disposable[]>();
  private _resolutionStack = new Set<ServiceIdentifier>();
  private _disposed = false;
  private _parent?: IServiceContainer;

  constructor(parent?: IServiceContainer) {
    this._parent = parent;
  }

  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = ServiceLifetime.Singleton
  ): this {
    this._ensureNotDisposed();

    const descriptor: ServiceDescriptor<T> = {
      identifier,
      factory,
      lifetime,
      dependencies: []
    };

    this._services.set(identifier, descriptor);

    // Clear cached instance if lifetime changed
    if (lifetime !== ServiceLifetime.Singleton && this._instances.has(identifier)) {
      this._disposeInstance(identifier);
    }

    return this;
  }

  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): this {
    this._ensureNotDisposed();

    this._services.set(identifier, {
      identifier,
      factory: () => instance,
      lifetime: ServiceLifetime.Singleton,
      dependencies: []
    });

    this._instances.set(identifier, instance);
    return this;
  }

  registerType<T>(
    identifier: ServiceIdentifier<T>,
    type: new (...args: any[]) => T,
    lifetime: ServiceLifetime = ServiceLifetime.Singleton
  ): this {
    return this.register(
      identifier,
      (container) => {
        // Use reflection to get constructor parameters if available
        const dependencies = this._getConstructorDependencies(type);
        const resolvedDeps = dependencies.map(dep => container.get(dep));
        return new type(...resolvedDeps);
      },
      lifetime
    );
  }

  registerService<T extends IService>(service: T): this {
    return this.registerInstance(service.id, service);
  }

  get<T>(identifier: ServiceIdentifier<T>): T {
    this._ensureNotDisposed();

    // Check for circular dependencies
    if (this._resolutionStack.has(identifier)) {
      const cycle = Array.from(this._resolutionStack).concat(identifier).map(String).join(' -> ');
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        `Circular dependency detected: ${cycle}`
      );
    }

    const descriptor = this._findDescriptor(identifier);
    if (!descriptor) {
      throw new LuckinError(
        ErrorCode.NotFound,
        `Service not registered: ${String(identifier)}`
      );
    }

    return this._resolve(descriptor);
  }

  tryGet<T>(identifier: ServiceIdentifier<T>): T | undefined {
    try {
      return this.get(identifier);
    } catch (error) {
      if (error instanceof LuckinError && error.code === ErrorCode.NotFound) {
        return undefined;
      }
      throw error;
    }
  }

  has(identifier: ServiceIdentifier): boolean {
    return this._findDescriptor(identifier) !== undefined;
  }

  createChild(): IServiceContainer {
    return new ServiceContainer(this);
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;

    // Dispose all instances
    for (const [identifier] of this._instances) {
      this._disposeInstance(identifier);
    }

    this._services.clear();
    this._instances.clear();
    this._disposables.clear();
    this._resolutionStack.clear();
  }

  // Advanced features

  /**
   * Register multiple services with a tag
   */
  registerTagged<T>(
    tag: string,
    services: Array<{
      identifier: ServiceIdentifier<T>;
      factory: ServiceFactory<T>;
      lifetime?: ServiceLifetime;
    }>
  ): this {
    for (const service of services) {
      this.register(service.identifier, service.factory, service.lifetime);
      this._addTag(service.identifier, tag);
    }
    return this;
  }

  /**
   * Get all services with a specific tag
   */
  getTagged<T>(tag: string): T[] {
    const services: T[] = [];
    
    for (const [identifier, descriptor] of this._services) {
      if (this._hasTag(identifier, tag)) {
        services.push(this.get<T>(descriptor.identifier));
      }
    }
    
    return services;
  }

  /**
   * Get service statistics
   */
  getStats(): {
    registeredServices: number;
    cachedInstances: number;
    isDisposed: boolean;
  } {
    return {
      registeredServices: this._services.size,
      cachedInstances: this._instances.size,
      isDisposed: this._disposed
    };
  }

  private _findDescriptor(identifier: ServiceIdentifier): ServiceDescriptor | undefined {
    let descriptor = this._services.get(identifier);
    
    if (!descriptor && this._parent) {
      // Check parent container
      const parentContainer = this._parent as ServiceContainer;
      descriptor = parentContainer._findDescriptor(identifier);
    }
    
    return descriptor;
  }

  private _resolve<T>(descriptor: ServiceDescriptor<T>): T {
    const { identifier, factory, lifetime } = descriptor;

    // Check cache for singleton/scoped
    if ((lifetime === ServiceLifetime.Singleton || lifetime === ServiceLifetime.Scoped) 
        && this._instances.has(identifier)) {
      return this._instances.get(identifier);
    }

    // Resolve dependencies
    this._resolutionStack.add(identifier);
    
    try {
      const instance = factory(this);
      
      // Cache instance if needed
      if (lifetime === ServiceLifetime.Singleton || lifetime === ServiceLifetime.Scoped) {
        this._instances.set(identifier, instance);
        
        // Track disposables
        if (instance && typeof (instance as any).dispose === 'function') {
          this._trackDisposable(identifier, instance as unknown as Disposable);
        }
      }

      // Initialize service if it implements IService
      if (instance && typeof (instance as any).initialize === 'function') {
        Promise.resolve((instance as unknown as IService).initialize?.()).catch(error => {
          console.error(`Failed to initialize service ${String(identifier)}:`, error);
        });
      }

      return instance;
    } finally {
      this._resolutionStack.delete(identifier);
    }
  }

  private _disposeInstance(identifier: ServiceIdentifier): void {
    const instance = this._instances.get(identifier);
    if (instance && typeof instance.dispose === 'function') {
      try {
        instance.dispose();
      } catch (error) {
        console.error(`Error disposing service ${String(identifier)}:`, error);
      }
    }

    // Dispose tracked disposables
    const disposables = this._disposables.get(identifier);
    if (disposables) {
      for (const disposable of disposables) {
        try {
          disposable.dispose();
        } catch (error) {
          console.error(`Error disposing tracked resource for ${String(identifier)}:`, error);
        }
      }
      this._disposables.delete(identifier);
    }

    this._instances.delete(identifier);
  }

  private _trackDisposable(identifier: ServiceIdentifier, disposable: Disposable): void {
    if (!this._disposables.has(identifier)) {
      this._disposables.set(identifier, []);
    }
    this._disposables.get(identifier)!.push(disposable);
  }

  private _ensureNotDisposed(): void {
    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot use disposed service container'
      );
    }
  }

  private _getConstructorDependencies(type: new (...args: any[]) => any): ServiceIdentifier[] {
    // This is a placeholder for reflection-based dependency discovery
    // In a real implementation, you might use reflect-metadata or similar
    return [];
  }

  private _tags = new Map<ServiceIdentifier, Set<string>>();

  private _addTag(identifier: ServiceIdentifier, tag: string): void {
    if (!this._tags.has(identifier)) {
      this._tags.set(identifier, new Set());
    }
    this._tags.get(identifier)!.add(tag);
  }

  private _hasTag(identifier: ServiceIdentifier, tag: string): boolean {
    const tags = this._tags.get(identifier);
    return tags ? tags.has(tag) : false;
  }
}

/**
 * Decorator for injectable services
 */
export function Injectable(identifier?: ServiceIdentifier) {
  return function <T extends new (...args: any[]) => any>(constructor: T): T {
    // Store metadata for later registration
    (constructor as any).__injectable__ = {
      identifier: identifier || constructor.name
    };
    return constructor;
  };
}

/**
 * Decorator for dependency injection
 */
export function Inject(identifier: ServiceIdentifier): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store injection metadata
    const existingTokens = (target.__inject_tokens__ || []);
    existingTokens[parameterIndex] = identifier;
    target.__inject_tokens__ = existingTokens;
  };
}

/**
 * Service locator for global access
 */
export class ServiceLocator {
  private static _container: IServiceContainer = new ServiceContainer();

  static setContainer(container: IServiceContainer): void {
    this._container = container;
  }

  static getContainer(): IServiceContainer {
    return this._container;
  }

  static get<T>(identifier: ServiceIdentifier<T>): T {
    return this._container.get(identifier);
  }

  static tryGet<T>(identifier: ServiceIdentifier<T>): T | undefined {
    return this._container.tryGet(identifier);
  }

  static has(identifier: ServiceIdentifier): boolean {
    return this._container.has(identifier);
  }
}

/**
 * Global service container instance
 */
export const globalContainer = new ServiceContainer();