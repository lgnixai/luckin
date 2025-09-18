/**
 * Legacy Editor Service - Compatibility wrapper
 * @deprecated Use EditorService from @lgnixai/luckin-core instead
 */

import { getGlobalApp, type EditorService } from '@lgnixai/luckin-core';

/**
 * @deprecated Legacy class for backward compatibility
 */
export class LegacyEditorService {
  private _service: EditorService;

  constructor() {
    console.warn('LegacyEditorService is deprecated. Use EditorService from @lgnixai/luckin-core instead.');
    this._service = getGlobalApp().getService<EditorService>('editor');
  }

  // Legacy method names mapped to new service
  createEditor = this._service.createDocument.bind(this._service);
  openFile = this._service.createDocument.bind(this._service);
  closeTab = this._service.closeDocument.bind(this._service);
  switchTab = (tabId: string) => {
    // Legacy implementation - find document and activate
    const groups = this._service.getGroups();
    for (const group of groups) {
      const tab = group.tabs.find(t => t.id === tabId);
      if (tab) {
        this._service.activateTab(tabId);
        break;
      }
    }
  };

  // Delegate all other methods
  get onDocumentCreated() { return this._service.onDocumentCreated; }
  get onDocumentChanged() { return this._service.onDocumentChanged; }
  get onTabOpened() { return this._service.onTabOpened; }
  get onTabClosed() { return this._service.onTabClosed; }
  
  getDocuments = this._service.getDocuments.bind(this._service);
  getGroups = this._service.getGroups.bind(this._service);
}

/**
 * @deprecated Use getGlobalApp().getService('editor') instead
 */
export function createLegacyEditorService(): LegacyEditorService {
  return new LegacyEditorService();
}