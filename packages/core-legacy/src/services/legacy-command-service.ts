/**
 * Legacy Command Service - Compatibility wrapper
 * @deprecated Use CommandService from @lgnixai/luckin-core instead
 */

import { getGlobalApp, type CommandService } from '@lgnixai/luckin-core';

/**
 * @deprecated Legacy class for backward compatibility
 */
export class LegacyCommandService {
  private _service: CommandService;

  constructor() {
    console.warn('LegacyCommandService is deprecated. Use CommandService from @lgnixai/luckin-core instead.');
    this._service = getGlobalApp().getService<CommandService>('command');
  }

  // Legacy method names
  register = this._service.registerCommand.bind(this._service);
  execute = this._service.executeCommand.bind(this._service);
  getCommands = this._service.getCommands.bind(this._service);
  
  // Additional legacy methods
  togglePalette = (show: boolean) => {
    // Legacy implementation - would show/hide command palette
    console.log('Toggle command palette:', show);
  };

  // Events
  get onCommandExecuted() { return this._service.onCommandExecuted; }
}

/**
 * @deprecated Use getGlobalApp().getService('command') instead
 */
export function createLegacyCommandService(): LegacyCommandService {
  return new LegacyCommandService();
}