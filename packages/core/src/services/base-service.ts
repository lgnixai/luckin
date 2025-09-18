/**
 * Base Service - Abstract base class for all services
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  IService, 
  Disposable, 
  IConfiguration 
} from '@lgnixai/luckin-foundation';
import { 
  BaseLifecycleService, 
  LuckinError, 
  ErrorCode 
} from '@lgnixai/luckin-foundation';

/**
 * Base service implementation with common functionality
 */
export abstract class BaseService extends BaseLifecycleService implements IService {
  protected _disposables: Disposable[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
    protected readonly config?: IConfiguration
  ) {
    super();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    if (this.disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        `Cannot initialize disposed service: ${this.name}`
      );
    }

    try {
      await this.onInitialize();
    } catch (error) {
      throw new LuckinError(
        ErrorCode.ServiceUnavailable,
        `Failed to initialize service ${this.name}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }
  }

  /**
   * Override to implement service-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Override in subclasses
  }

  /**
   * Override to implement service-specific disposal
   */
  protected onDispose(): void {
    // Dispose all tracked disposables
    for (const disposable of this._disposables) {
      try {
        disposable.dispose();
      } catch (error) {
        console.error(`Error disposing resource in service ${this.name}:`, error);
      }
    }
    this._disposables.length = 0;
  }

  /**
   * Track a disposable resource
   */
  protected track<T extends Disposable>(disposable: T): T {
    this._disposables.push(disposable);
    return disposable;
  }

  /**
   * Get configuration value
   */
  protected getConfig<T>(key: string, defaultValue?: T): T | undefined {
    return this.config?.get(key, defaultValue);
  }

  /**
   * Set configuration value
   */
  protected setConfig<T>(key: string, value: T): void {
    this.config?.set(key, value);
  }

  /**
   * Watch configuration changes
   */
  protected watchConfig(callback: (key: string, value: any) => void): Disposable {
    if (!this.config) {
      return { dispose: () => {} };
    }

    return this.track(this.config.onDidChange(({ key, value }) => {
      try {
        callback(key, value);
      } catch (error) {
        console.error(`Error in config watcher for service ${this.name}:`, error);
      }
    }));
  }
}

/**
 * Service registry for managing service instances
 */
export class ServiceRegistry {
  private _services = new Map<string, IService>();
  private _disposed = false;

  /**
   * Register a service
   */
  register(service: IService): Disposable {
    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot register service to disposed registry'
      );
    }

    if (this._services.has(service.id)) {
      throw new LuckinError(
        ErrorCode.AlreadyExists,
        `Service already registered: ${service.id}`
      );
    }

    this._services.set(service.id, service);

    return {
      dispose: () => {
        this._services.delete(service.id);
      }
    };
  }

  /**
   * Get a service by ID
   */
  get<T extends IService>(id: string): T | undefined {
    return this._services.get(id) as T | undefined;
  }

  /**
   * Check if service is registered
   */
  has(id: string): boolean {
    return this._services.has(id);
  }

  /**
   * Get all registered services
   */
  getAll(): IService[] {
    return Array.from(this._services.values());
  }

  /**
   * Initialize all services
   */
  async initializeAll(): Promise<void> {
    const services = this.getAll();
    
    await Promise.all(services.map(async service => {
      try {
        if (service.initialize) {
          await service.initialize();
        }
      } catch (error) {
        console.error(`Failed to initialize service ${service.name}:`, error);
        throw error;
      }
    }));
  }

  /**
   * Dispose all services
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;

    for (const service of this._services.values()) {
      try {
        service.dispose();
      } catch (error) {
        console.error(`Error disposing service ${service.name}:`, error);
      }
    }

    this._services.clear();
  }
}

/**
 * Global service registry
 */
export const globalServiceRegistry = new ServiceRegistry();