/**
 * Legacy Notification Service - Compatibility wrapper
 * @deprecated Use NotificationService from @lgnixai/luckin-core instead
 */

import { getGlobalApp, type NotificationService } from '@lgnixai/luckin-core';

/**
 * @deprecated Legacy class for backward compatibility
 */
export class LegacyNotificationService {
  private _service: NotificationService;

  constructor() {
    console.warn('LegacyNotificationService is deprecated. Use NotificationService from @lgnixai/luckin-core instead.');
    this._service = getGlobalApp().getService<NotificationService>('notification');
  }

  // Legacy method names
  showInfo = this._service.info.bind(this._service);
  showSuccess = this._service.success.bind(this._service);
  showWarning = this._service.warning.bind(this._service);
  showError = this._service.error.bind(this._service);
  show = this._service.show.bind(this._service);
  clear = this._service.clear.bind(this._service);
  
  // Events
  get onNotificationAdded() { return this._service.onNotificationAdded; }
  get onNotificationRemoved() { return this._service.onNotificationRemoved; }
}

/**
 * @deprecated Use getGlobalApp().getService('notification') instead
 */
export function createLegacyNotificationService(): LegacyNotificationService {
  return new LegacyNotificationService();
}