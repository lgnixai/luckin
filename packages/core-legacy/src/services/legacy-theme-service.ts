/**
 * Legacy Theme Service - Compatibility wrapper
 * @deprecated Use ThemeService from @lgnixai/luckin-core instead
 */

import { getGlobalApp, type ThemeService } from '@lgnixai/luckin-core';

/**
 * @deprecated Legacy class for backward compatibility
 */
export class LegacyThemeService {
  private _service: ThemeService;

  constructor() {
    console.warn('LegacyThemeService is deprecated. Use ThemeService from @lgnixai/luckin-core instead.');
    this._service = getGlobalApp().getService<ThemeService>('theme');
  }

  // Legacy method names
  getCurrentTheme = () => this._service.currentTheme;
  setTheme = this._service.setTheme.bind(this._service);
  getThemes = this._service.getThemes.bind(this._service);
  toggleTheme = this._service.toggleTheme.bind(this._service);
  
  // Events
  get onThemeChanged() { return this._service.onThemeChanged; }
}

/**
 * @deprecated Use getGlobalApp().getService('theme') instead
 */
export function createLegacyThemeService(): LegacyThemeService {
  return new LegacyThemeService();
}