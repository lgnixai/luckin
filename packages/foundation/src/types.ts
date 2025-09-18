/**
 * Foundation Types - Core type definitions for Luckin IDE
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

// ============================================================================
// Basic Types
// ============================================================================

export type UniqueId = string | number;

/**
 * Represents a disposable resource
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Represents an asynchronously disposable resource
 */
export interface AsyncDisposable {
  dispose(): Promise<void>;
}

/**
 * Cancellation token for async operations
 */
export interface CancellationToken {
  readonly isCancellationRequested: boolean;
  readonly onCancellationRequested: Event<void>;
}

/**
 * Progress reporting interface
 */
export interface Progress<T = any> {
  report(value: T): void;
}

// ============================================================================
// Event System Types
// ============================================================================

/**
 * Event listener function
 */
export type EventListener<T = any> = (event: T) => void;

/**
 * Event interface
 */
export interface Event<T = any> {
  (listener: EventListener<T>): Disposable;
}

/**
 * Event emitter interface
 */
export interface EventEmitter<T = any> {
  readonly event: Event<T>;
  fire(data: T): void;
  dispose(): void;
}

/**
 * Event bus interface
 */
export interface IEventBus extends Disposable {
  on<T = any>(eventType: string, listener: EventListener<T>): Disposable;
  off<T = any>(eventType: string, listener: EventListener<T>): void;
  emit<T = any>(eventType: string, data?: T): void;
  once<T = any>(eventType: string, listener: EventListener<T>): Disposable;
}

// ============================================================================
// Service System Types
// ============================================================================

/**
 * Service identifier type
 */
export type ServiceIdentifier<T = any> = string | symbol | (new (...args: any[]) => T);

/**
 * Service factory function
 */
export type ServiceFactory<T = any> = (container: IServiceContainer) => T;

/**
 * Service lifetime enumeration
 */
export enum ServiceLifetime {
  Transient = 'transient',
  Singleton = 'singleton',
  Scoped = 'scoped'
}

/**
 * Service descriptor
 */
export interface ServiceDescriptor<T = any> {
  identifier: ServiceIdentifier<T>;
  factory: ServiceFactory<T>;
  lifetime: ServiceLifetime;
  dependencies?: ServiceIdentifier[];
}

/**
 * Service container interface
 */
export interface IServiceContainer extends Disposable {
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: ServiceFactory<T>,
    lifetime?: ServiceLifetime
  ): this;
  
  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): this;
  registerType<T>(
    identifier: ServiceIdentifier<T>,
    type: new (...args: any[]) => T,
    lifetime?: ServiceLifetime
  ): this;
  
  get<T>(identifier: ServiceIdentifier<T>): T;
  tryGet<T>(identifier: ServiceIdentifier<T>): T | undefined;
  has(identifier: ServiceIdentifier): boolean;
  
  createChild(): IServiceContainer;
}

/**
 * Base service interface
 */
export interface IService extends Disposable {
  readonly id: string;
  readonly name: string;
  initialize?(): Promise<void> | void;
}

// ============================================================================
// Lifecycle Types
// ============================================================================

/**
 * Lifecycle phase enumeration
 */
export enum LifecyclePhase {
  Starting = 1,
  Ready = 2,
  Restored = 3,
  Eventually = 4
}

/**
 * Lifecycle manager interface
 */
export interface ILifecycleManager extends Disposable {
  readonly phase: LifecyclePhase;
  readonly onDidChangePhase: Event<LifecyclePhase>;
  
  when(phase: LifecyclePhase): Promise<void>;
  setPhase(phase: LifecyclePhase): Promise<void>;
  shutdown(): Promise<void>;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Error codes enumeration
 */
export enum ErrorCode {
  Unknown = 'UNKNOWN',
  InvalidArgument = 'INVALID_ARGUMENT',
  NotFound = 'NOT_FOUND',
  AlreadyExists = 'ALREADY_EXISTS',
  PermissionDenied = 'PERMISSION_DENIED',
  Timeout = 'TIMEOUT',
  ServiceUnavailable = 'SERVICE_UNAVAILABLE',
  ConfigurationError = 'CONFIGURATION_ERROR'
}

/**
 * Luckin error interface
 */
export interface ILuckinError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly stack?: string;
  readonly cause?: Error;
  readonly recoverable: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration interface
 */
export interface IConfiguration extends Disposable {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  remove(key: string): void;
  onDidChange: Event<{ key: string; value: any }>;
  update(config: Record<string, any>): void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Position interface
 */
export interface Position {
  readonly line: number;
  readonly column: number;
}

/**
 * Range interface
 */
export interface Range {
  readonly start: Position;
  readonly end: Position;
}

/**
 * Rectangle interface
 */
export interface Rectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Theme interface
 */
export interface Theme {
  readonly id: string;
  readonly name: string;
  readonly type: 'light' | 'dark' | 'high-contrast';
  readonly colors: Record<string, string>;
}

/**
 * Keybinding interface
 */
export interface Keybinding {
  readonly key: string;
  readonly command: string;
  readonly when?: string;
  readonly args?: any[];
}

// ============================================================================
// Generic Utility Types
// ============================================================================

/**
 * Make properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make properties required
 */
export type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

/**
 * Deep readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Mutable version of readonly type
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};