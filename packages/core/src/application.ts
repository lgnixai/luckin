/**
 * Luckin Application - Main application class
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  IServiceContainer, 
  ILifecycleManager,
  IConfiguration
} from '@lgnixai/luckin-foundation';
import { 
  ServiceContainer, 
  LifecycleManager, 
  LifecyclePhase,
  ServiceLifetime,
  LuckinError,
  ErrorCode
} from '@lgnixai/luckin-foundation';

import { Configuration, type ILuckinConfig } from './config';
import { 
  EditorService, 
  ThemeService, 
  CommandService, 
  NotificationService,
  globalServiceRegistry 
} from './services';

/**
 * Application startup options
 */
export interface IApplicationOptions {
  container?: IServiceContainer;
  lifecycle?: ILifecycleManager;
  config?: ILuckinConfig;
}

/**
 * Main Luckin application class
 */
export class LuckinApplication {
  private _container: IServiceContainer;
  private _lifecycle: ILifecycleManager;
  private _configuration: IConfiguration;
  private _initialized = false;
  private _disposed = false;

  constructor(options: IApplicationOptions = {}) {
    this._container = options.container || new ServiceContainer();
    this._lifecycle = options.lifecycle || new LifecycleManager();
    this._configuration = new Configuration(options.config);

    this._setupServices();
  }

  get container(): IServiceContainer {
    return this._container;
  }

  get lifecycle(): ILifecycleManager {
    return this._lifecycle;
  }

  get configuration(): IConfiguration {
    return this._configuration;
  }

  get isInitialized(): boolean {
    return this._initialized;
  }

  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    if (this._initialized) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Application is already initialized'
      );
    }

    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot initialize disposed application'
      );
    }

    try {
      console.log('Initializing Luckin IDE...');

      // Phase 1: Starting
      await this._lifecycle.setPhase(LifecyclePhase.Starting);

      // Initialize core services
      await this._initializeServices();

      // Phase 2: Ready
      await this._lifecycle.setPhase(LifecyclePhase.Ready);

      // Phase 3: Restored
      await this._lifecycle.setPhase(LifecyclePhase.Restored);

      // Phase 4: Eventually
      await this._lifecycle.setPhase(LifecyclePhase.Eventually);

      this._initialized = true;
      console.log('Luckin IDE initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Luckin IDE:', error);
      throw error;
    }
  }

  /**
   * Dispose the application
   */
  async dispose(): Promise<void> {
    if (this._disposed) {
      return;
    }

    console.log('Disposing Luckin IDE...');

    try {
      // Shutdown lifecycle
      await this._lifecycle.shutdown();

      // Dispose services
      globalServiceRegistry.dispose();

      // Dispose container
      this._container.dispose();

      // Dispose configuration
      this._configuration.dispose();

      // Dispose lifecycle manager
      this._lifecycle.dispose();

      this._disposed = true;
      console.log('Luckin IDE disposed successfully');

    } catch (error) {
      console.error('Error during application disposal:', error);
      throw error;
    }
  }

  /**
   * Get a service from the container
   */
  getService<T>(identifier: string): T {
    return this._container.get<T>(identifier);
  }

  /**
   * Register a service
   */
  registerService<T>(
    identifier: string, 
    service: T, 
    lifetime: ServiceLifetime = ServiceLifetime.Singleton
  ): void {
    if (typeof service === 'function') {
      this._container.register(identifier, service as any, lifetime);
    } else {
      this._container.registerInstance(identifier, service);
    }
  }

  private _setupServices(): void {
    // Register configuration
    this._container.registerInstance('configuration', this._configuration);

    // Register core services
    this._container.register(
      'editor',
      (container) => new EditorService(container.get('configuration')),
      ServiceLifetime.Singleton
    );

    this._container.register(
      'theme',
      (container) => new ThemeService(container.get('configuration')),
      ServiceLifetime.Singleton
    );

    this._container.register(
      'command',
      (container) => new CommandService(container.get('configuration')),
      ServiceLifetime.Singleton
    );

    this._container.register(
      'notification',
      (container) => new NotificationService(container.get('configuration')),
      ServiceLifetime.Singleton
    );
  }

  private async _initializeServices(): Promise<void> {
    // Get all services and initialize them
    const editorService = this._container.get<EditorService>('editor');
    const themeService = this._container.get<ThemeService>('theme');
    const commandService = this._container.get<CommandService>('command');
    const notificationService = this._container.get<NotificationService>('notification');

    // Register with global registry (check if already registered to avoid duplicates)
    if (!globalServiceRegistry.has(editorService.id)) {
      globalServiceRegistry.register(editorService);
    }
    if (!globalServiceRegistry.has(themeService.id)) {
      globalServiceRegistry.register(themeService);
    }
    if (!globalServiceRegistry.has(commandService.id)) {
      globalServiceRegistry.register(commandService);
    }
    if (!globalServiceRegistry.has(notificationService.id)) {
      globalServiceRegistry.register(notificationService);
    }

    // Initialize all services
    await globalServiceRegistry.initializeAll();

    // Show welcome notification
    notificationService.success('Luckin IDE is ready!', {
      title: 'Welcome',
      description: 'All systems are initialized and ready to use.'
    });
  }
}

/**
 * Create and configure a new Luckin application
 */
export function createLuckinApp(options: IApplicationOptions = {}): LuckinApplication {
  return new LuckinApplication(options);
}

/**
 * Global application instance (for convenience)
 */
let _globalApp: LuckinApplication | undefined;

/**
 * Get or create global application instance
 */
export function getGlobalApp(): LuckinApplication {
  if (!_globalApp) {
    _globalApp = createLuckinApp();
  }
  return _globalApp;
}

/**
 * Initialize global application
 */
export async function initializeGlobalApp(config?: ILuckinConfig): Promise<LuckinApplication> {
  const app = getGlobalApp();
  
  if (config) {
    app.configuration.update(config);
  }
  
  if (!app.isInitialized) {
    await app.initialize();
  }
  
  return app;
}

/**
 * Dispose global application
 */
export async function disposeGlobalApp(): Promise<void> {
  if (_globalApp) {
    await _globalApp.dispose();
    _globalApp = undefined;
  }
}