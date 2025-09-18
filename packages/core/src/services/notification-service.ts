/**
 * Notification Service - Toast notifications and messages
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Event, 
  IConfiguration 
} from '@lgnixai/luckin-foundation';
import { Emitter } from '@lgnixai/luckin-foundation';
import { BaseService } from './base-service';

/**
 * Notification severity levels
 */
export enum NotificationSeverity {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error'
}

/**
 * Notification interface
 */
export interface INotification {
  readonly id: string;
  readonly message: string;
  readonly severity: NotificationSeverity;
  readonly title?: string;
  readonly description?: string;
  readonly actions?: INotificationAction[];
  readonly timeout?: number;
  readonly persistent?: boolean;
  readonly timestamp: number;
}

/**
 * Notification action interface
 */
export interface INotificationAction {
  readonly id: string;
  readonly label: string;
  readonly primary?: boolean;
  readonly handler: () => void | Promise<void>;
}

/**
 * Notification options
 */
export interface INotificationOptions {
  title?: string;
  description?: string;
  actions?: INotificationAction[];
  timeout?: number;
  persistent?: boolean;
}

/**
 * Notification service implementation
 */
export class NotificationService extends BaseService {
  private _notifications = new Map<string, INotification>();
  private _nextId = 1;
  
  private _onNotificationAdded = new Emitter<INotification>();
  private _onNotificationRemoved = new Emitter<string>();
  private _onNotificationCleared = new Emitter<void>();
  private _onActionExecuted = new Emitter<{ notificationId: string; actionId: string }>();

  constructor(config?: IConfiguration) {
    super('notification', 'Notification Service', config);
    
    this.track(this._onNotificationAdded);
    this.track(this._onNotificationRemoved);
    this.track(this._onNotificationCleared);
    this.track(this._onActionExecuted);
  }

  get onNotificationAdded(): Event<INotification> { return this._onNotificationAdded.event; }
  get onNotificationRemoved(): Event<string> { return this._onNotificationRemoved.event; }
  get onNotificationCleared(): Event<void> { return this._onNotificationCleared.event; }
  get onActionExecuted(): Event<{ notificationId: string; actionId: string }> { return this._onActionExecuted.event; }

  /**
   * Show an info notification
   */
  info(message: string, options: INotificationOptions = {}): string {
    return this._addNotification(message, NotificationSeverity.Info, options);
  }

  /**
   * Show a success notification
   */
  success(message: string, options: INotificationOptions = {}): string {
    return this._addNotification(message, NotificationSeverity.Success, options);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, options: INotificationOptions = {}): string {
    return this._addNotification(message, NotificationSeverity.Warning, options);
  }

  /**
   * Show an error notification
   */
  error(message: string, options: INotificationOptions = {}): string {
    return this._addNotification(message, NotificationSeverity.Error, {
      ...options,
      persistent: options.persistent ?? true // Errors are persistent by default
    });
  }

  /**
   * Show a notification with custom severity
   */
  show(
    message: string, 
    severity: NotificationSeverity, 
    options: INotificationOptions = {}
  ): string {
    return this._addNotification(message, severity, options);
  }

  /**
   * Remove a notification
   */
  remove(id: string): void {
    if (this._notifications.delete(id)) {
      this._onNotificationRemoved.fire(id);
    }
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this._notifications.clear();
    this._onNotificationCleared.fire();
  }

  /**
   * Clear notifications by severity
   */
  clearBySeverity(severity: NotificationSeverity): void {
    const toRemove: string[] = [];
    
    for (const [id, notification] of this._notifications.entries()) {
      if (notification.severity === severity) {
        toRemove.push(id);
      }
    }
    
    for (const id of toRemove) {
      this.remove(id);
    }
  }

  /**
   * Get notification by ID
   */
  getNotification(id: string): INotification | undefined {
    return this._notifications.get(id);
  }

  /**
   * Get all notifications
   */
  getNotifications(): INotification[] {
    return Array.from(this._notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
  }

  /**
   * Get notifications by severity
   */
  getNotificationsBySeverity(severity: NotificationSeverity): INotification[] {
    return this.getNotifications().filter(n => n.severity === severity);
  }

  /**
   * Execute a notification action
   */
  async executeAction(notificationId: string, actionId: string): Promise<void> {
    const notification = this._notifications.get(notificationId);
    if (!notification) {
      return;
    }

    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) {
      return;
    }

    try {
      await Promise.resolve(action.handler());
      this._onActionExecuted.fire({ notificationId, actionId });
      
      // Remove notification after action execution (unless persistent)
      if (!notification.persistent) {
        this.remove(notificationId);
      }
    } catch (error) {
      console.error(`Error executing notification action ${actionId}:`, error);
    }
  }

  /**
   * Get notification count by severity
   */
  getCount(severity?: NotificationSeverity): number {
    if (severity) {
      return this.getNotificationsBySeverity(severity).length;
    }
    return this._notifications.size;
  }

  private _addNotification(
    message: string, 
    severity: NotificationSeverity, 
    options: INotificationOptions
  ): string {
    const id = `notification-${this._nextId++}`;
    const defaultTimeout = this._getDefaultTimeout(severity);
    
    const notification: INotification = {
      id,
      message,
      severity,
      title: options.title,
      description: options.description,
      actions: options.actions,
      timeout: options.timeout ?? defaultTimeout,
      persistent: options.persistent ?? false,
      timestamp: Date.now()
    };

    this._notifications.set(id, notification);
    this._onNotificationAdded.fire(notification);

    // Auto-remove after timeout (unless persistent)
    if (!notification.persistent && notification.timeout && notification.timeout > 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.timeout);
    }

    return id;
  }

  private _getDefaultTimeout(severity: NotificationSeverity): number {
    switch (severity) {
      case NotificationSeverity.Info:
        return 4000;
      case NotificationSeverity.Success:
        return 3000;
      case NotificationSeverity.Warning:
        return 6000;
      case NotificationSeverity.Error:
        return 0; // No timeout for errors
      default:
        return 4000;
    }
  }
}

/**
 * Notification service identifier
 */
export const NOTIFICATION_SERVICE_ID = 'notification';

/**
 * Helper functions for creating common notification actions
 */
export const NotificationActions = {
  /**
   * Create a dismiss action
   */
  dismiss(): INotificationAction {
    return {
      id: 'dismiss',
      label: 'Dismiss',
      handler: () => {
        // The notification will be removed automatically
      }
    };
  },

  /**
   * Create an action that opens a URL
   */
  openUrl(url: string, label: string = 'Open'): INotificationAction {
    return {
      id: 'open-url',
      label,
      primary: true,
      handler: () => {
        window.open(url, '_blank');
      }
    };
  },

  /**
   * Create an action that executes a command
   */
  executeCommand(commandId: string, label: string, args: any[] = []): INotificationAction {
    return {
      id: 'execute-command',
      label,
      primary: true,
      handler: async () => {
        // This would need access to CommandService
        console.log(`Executing command: ${commandId}`, args);
      }
    };
  },

  /**
   * Create a retry action
   */
  retry(handler: () => void | Promise<void>): INotificationAction {
    return {
      id: 'retry',
      label: 'Retry',
      primary: true,
      handler
    };
  }
};