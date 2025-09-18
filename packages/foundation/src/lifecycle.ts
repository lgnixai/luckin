/**
 * Lifecycle Management - Application lifecycle coordination for Luckin IDE
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Disposable, 
  Event, 
  ILifecycleManager
} from './types';
import { LifecyclePhase } from './types';
import { Emitter } from './events';
import { LuckinError, ErrorCode } from './errors';

/**
 * Lifecycle service interface
 */
export interface ILifecycleService extends Disposable {
  readonly phase: LifecyclePhase;
  onWillStart?: () => Promise<void> | void;
  onDidStart?: () => Promise<void> | void;
  onWillRestore?: () => Promise<void> | void;
  onDidRestore?: () => Promise<void> | void;
  onWillShutdown?: () => Promise<void> | void;
}

/**
 * Lifecycle manager implementation
 */
export class LifecycleManager implements ILifecycleManager {
  private _phase: LifecyclePhase = LifecyclePhase.Starting;
  private _onDidChangePhase = new Emitter<LifecyclePhase>();
  private _services = new Set<ILifecycleService>();
  private _disposed = false;

  get phase(): LifecyclePhase {
    return this._phase;
  }

  get onDidChangePhase(): Event<LifecyclePhase> {
    return this._onDidChangePhase.event;
  }

  /**
   * Register a lifecycle service
   */
  registerService(service: ILifecycleService): Disposable {
    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot register service to disposed lifecycle manager'
      );
    }

    this._services.add(service);

    return {
      dispose: () => {
        this._services.delete(service);
      }
    };
  }

  /**
   * Wait for a specific lifecycle phase
   */
  async when(phase: LifecyclePhase): Promise<void> {
    if (this._phase >= phase) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const disposable = this.onDidChangePhase(currentPhase => {
        if (currentPhase >= phase) {
          disposable.dispose();
          resolve();
        }
      });
    });
  }

  /**
   * Set the current lifecycle phase
   */
  async setPhase(phase: LifecyclePhase): Promise<void> {
    if (this._disposed) {
      return;
    }

    if (phase <= this._phase) {
      console.warn(`Attempted to set lifecycle phase backwards: ${phase} <= ${this._phase}`);
      return;
    }

    console.log(`Lifecycle phase transition: ${LifecyclePhase[this._phase]} -> ${LifecyclePhase[phase]}`);

    try {
      // Execute phase transition hooks
      await this._executePhaseTransition(this._phase, phase);
      
      this._phase = phase;
      this._onDidChangePhase.fire(phase);
      
      console.log(`Lifecycle phase set to: ${LifecyclePhase[phase]}`);
    } catch (error) {
      console.error(`Failed to transition to lifecycle phase ${LifecyclePhase[phase]}:`, error);
      throw error;
    }
  }

  /**
   * Start the application lifecycle
   */
  async startup(): Promise<void> {
    console.log('Starting Luckin IDE lifecycle...');
    
    try {
      await this.setPhase(LifecyclePhase.Ready);
      await this.setPhase(LifecyclePhase.Restored);
      await this.setPhase(LifecyclePhase.Eventually);
      
      console.log('Luckin IDE lifecycle startup completed');
    } catch (error) {
      console.error('Lifecycle startup failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown the application lifecycle
   */
  async shutdown(): Promise<void> {
    if (this._disposed) {
      return;
    }

    console.log('Shutting down Luckin IDE lifecycle...');

    try {
      // Execute shutdown hooks
      await this._executeShutdownHooks();
      
      // Dispose all services
      const services = Array.from(this._services);
      await Promise.all(services.map(service => {
        try {
          return Promise.resolve(service.dispose());
        } catch (error) {
          console.error('Error disposing lifecycle service:', error);
          return Promise.resolve();
        }
      }));

      console.log('Luckin IDE lifecycle shutdown completed');
    } catch (error) {
      console.error('Lifecycle shutdown failed:', error);
      throw error;
    }
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this._services.clear();
    this._onDidChangePhase.dispose();
  }

  private async _executePhaseTransition(from: LifecyclePhase, to: LifecyclePhase): Promise<void> {
    const services = Array.from(this._services);

    switch (to) {
      case LifecyclePhase.Ready:
        await this._executeHooks(services, 'onWillStart');
        await this._executeHooks(services, 'onDidStart');
        break;

      case LifecyclePhase.Restored:
        await this._executeHooks(services, 'onWillRestore');
        await this._executeHooks(services, 'onDidRestore');
        break;

      case LifecyclePhase.Eventually:
        // No specific hooks for Eventually phase
        break;
    }
  }

  private async _executeShutdownHooks(): Promise<void> {
    const services = Array.from(this._services);
    await this._executeHooks(services, 'onWillShutdown');
  }

  private async _executeHooks(
    services: ILifecycleService[], 
    hookName: keyof ILifecycleService
  ): Promise<void> {
    const promises = services.map(async service => {
      const hook = service[hookName];
      if (typeof hook === 'function') {
        try {
          await Promise.resolve(hook.call(service));
        } catch (error) {
          console.error(`Error in lifecycle hook ${String(hookName)}:`, error);
          // Don't let one service failure break the entire lifecycle
        }
      }
    });

    await Promise.all(promises);
  }
}

/**
 * Base lifecycle service implementation
 */
export abstract class BaseLifecycleService implements ILifecycleService {
  private _disposed = false;

  get phase(): LifecyclePhase {
    return globalLifecycleManager.phase;
  }

  protected get disposed(): boolean {
    return this._disposed;
  }

  async onWillStart?(): Promise<void>;
  async onDidStart?(): Promise<void>;
  async onWillRestore?(): Promise<void>;
  async onDidRestore?(): Promise<void>;
  async onWillShutdown?(): Promise<void>;

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this.onDispose();
    }
  }

  protected onDispose(): void {
    // Override in subclasses
  }
}

/**
 * Lifecycle decorator for automatic registration
 */
export function LifecycleService() {
  return function <T extends new (...args: any[]) => ILifecycleService>(constructor: T): T {
    // Mark class as lifecycle service for automatic registration
    (constructor as any).__lifecycle_service__ = true;
    return constructor;
  };
}

/**
 * Global lifecycle manager instance
 */
export const globalLifecycleManager = new LifecycleManager();

/**
 * Utility functions for lifecycle management
 */
export const LifecycleUtils = {
  /**
   * Wait for application to be ready
   */
  whenReady(): Promise<void> {
    return globalLifecycleManager.when(LifecyclePhase.Ready);
  },

  /**
   * Wait for application to be restored
   */
  whenRestored(): Promise<void> {
    return globalLifecycleManager.when(LifecyclePhase.Restored);
  },

  /**
   * Wait for application to be fully started
   */
  whenStarted(): Promise<void> {
    return globalLifecycleManager.when(LifecyclePhase.Eventually);
  },

  /**
   * Get current phase name
   */
  getPhaseName(phase: LifecyclePhase): string {
    return LifecyclePhase[phase];
  }
};