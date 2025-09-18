/**
 * Compatibility Layer - Backward compatibility with legacy code
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

// Re-export foundation types for legacy compatibility
export type {
  Disposable,
  IService,
  IConfiguration,
  ServiceIdentifier,
  ServiceLifetime
} from '@lgnixai/luckin-foundation';

export {
  ErrorCode,
  LifecyclePhase
} from '@lgnixai/luckin-foundation';

// Re-export services for legacy compatibility
export type {
  IEditorDocument,
  IEditorTab,
  IEditorGroup
} from './services/editor-service';

export type {
  ITheme
} from './services/theme-service';

export type {
  ICommand,
  CommandHandler
} from './services/command-service';

export type {
  INotification,
  INotificationAction,
  NotificationSeverity
} from './services/notification-service';

// Re-export configuration types
export type {
  ILuckinConfig
} from './config';

// Legacy service IDs (for backward compatibility)
export const SERVICE_IDS = {
  EDITOR: 'editor',
  THEME: 'theme',
  COMMAND: 'command',
  NOTIFICATION: 'notification',
  CONFIGURATION: 'configuration'
} as const;

// Legacy error types (for backward compatibility)
export const ERROR_CODES = {
  UNKNOWN: ErrorCode.Unknown,
  INVALID_ARGUMENT: ErrorCode.InvalidArgument,
  NOT_FOUND: ErrorCode.NotFound,
  ALREADY_EXISTS: ErrorCode.AlreadyExists,
  PERMISSION_DENIED: ErrorCode.PermissionDenied,
  TIMEOUT: ErrorCode.Timeout,
  SERVICE_UNAVAILABLE: ErrorCode.ServiceUnavailable,
  CONFIGURATION_ERROR: ErrorCode.ConfigurationError
} as const;

// Legacy lifecycle phases (for backward compatibility)
export const LIFECYCLE_PHASES = {
  STARTING: LifecyclePhase.Starting,
  READY: LifecyclePhase.Ready,
  RESTORED: LifecyclePhase.Restored,
  EVENTUALLY: LifecyclePhase.Eventually
} as const;