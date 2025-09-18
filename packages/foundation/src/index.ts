/**
 * Luckin Foundation - Core infrastructure for Luckin IDE
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

// Types
export * from './types';

// Error handling
export * from './errors';

// Event system
export * from './events';

// Dependency injection
export * from './di';

// Lifecycle management
export * from './lifecycle';

// Re-export commonly used types for convenience
export type {
  Disposable,
  AsyncDisposable,
  Event,
  EventListener,
  EventEmitter,
  IEventBus,
  IServiceContainer,
  IService,
  ILifecycleManager,
  IConfiguration,
  ServiceIdentifier,
  ServiceFactory
} from './types';

// Re-export commonly used enums
export { 
  ServiceLifetime, 
  LifecyclePhase, 
  ErrorCode 
} from './types';