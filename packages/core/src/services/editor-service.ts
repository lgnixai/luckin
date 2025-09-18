/**
 * Editor Service - Core editor management and functionality
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Disposable, 
  Event, 
  IConfiguration 
} from '@lgnixai/luckin-foundation';
import { Emitter } from '@lgnixai/luckin-foundation';
import { BaseService } from './base-service';

/**
 * Editor document interface
 */
export interface IEditorDocument {
  readonly id: string;
  readonly uri: string;
  readonly language: string;
  content: string;
  readonly isDirty: boolean;
  readonly isReadonly: boolean;
  readonly version: number;
}

/**
 * Editor tab interface
 */
export interface IEditorTab {
  readonly id: string;
  readonly title: string;
  readonly documentId: string;
  readonly isActive: boolean;
  readonly isPinned: boolean;
  readonly isDirty: boolean;
}

/**
 * Editor group interface
 */
export interface IEditorGroup {
  readonly id: string;
  readonly tabs: IEditorTab[];
  readonly activeTabId?: string;
}

/**
 * Editor events
 */
export interface IEditorEvents {
  documentCreated: IEditorDocument;
  documentChanged: { document: IEditorDocument; changes: any[] };
  documentSaved: IEditorDocument;
  documentClosed: IEditorDocument;
  tabOpened: IEditorTab;
  tabClosed: IEditorTab;
  tabActivated: IEditorTab;
  groupCreated: IEditorGroup;
  groupClosed: IEditorGroup;
}

/**
 * Editor service implementation
 */
export class EditorService extends BaseService {
  private _documents = new Map<string, IEditorDocument>();
  private _groups = new Map<string, IEditorGroup>();
  private _activeGroupId?: string;
  
  // Events
  private _onDocumentCreated = new Emitter<IEditorDocument>();
  private _onDocumentChanged = new Emitter<{ document: IEditorDocument; changes: any[] }>();
  private _onDocumentSaved = new Emitter<IEditorDocument>();
  private _onDocumentClosed = new Emitter<IEditorDocument>();
  private _onTabOpened = new Emitter<IEditorTab>();
  private _onTabClosed = new Emitter<IEditorTab>();
  private _onTabActivated = new Emitter<IEditorTab>();
  private _onGroupCreated = new Emitter<IEditorGroup>();
  private _onGroupClosed = new Emitter<IEditorGroup>();

  constructor(config?: IConfiguration) {
    super('editor', 'Editor Service', config);
    
    // Track emitters for disposal
    this.track(this._onDocumentCreated);
    this.track(this._onDocumentChanged);
    this.track(this._onDocumentSaved);
    this.track(this._onDocumentClosed);
    this.track(this._onTabOpened);
    this.track(this._onTabClosed);
    this.track(this._onTabActivated);
    this.track(this._onGroupCreated);
    this.track(this._onGroupClosed);
  }

  // Event accessors
  get onDocumentCreated(): Event<IEditorDocument> { return this._onDocumentCreated.event; }
  get onDocumentChanged(): Event<{ document: IEditorDocument; changes: any[] }> { return this._onDocumentChanged.event; }
  get onDocumentSaved(): Event<IEditorDocument> { return this._onDocumentSaved.event; }
  get onDocumentClosed(): Event<IEditorDocument> { return this._onDocumentClosed.event; }
  get onTabOpened(): Event<IEditorTab> { return this._onTabOpened.event; }
  get onTabClosed(): Event<IEditorTab> { return this._onTabClosed.event; }
  get onTabActivated(): Event<IEditorTab> { return this._onTabActivated.event; }
  get onGroupCreated(): Event<IEditorGroup> { return this._onGroupCreated.event; }
  get onGroupClosed(): Event<IEditorGroup> { return this._onGroupClosed.event; }

  protected async onInitialize(): Promise<void> {
    // Create default editor group
    this.createGroup('default');
    
    // Create welcome document
    this.createDocument('welcome', 'Welcome to Luckin IDE', 'markdown', false);
  }

  /**
   * Create a new document
   */
  createDocument(
    uri: string, 
    content: string = '', 
    language: string = 'plaintext',
    readonly: boolean = false
  ): IEditorDocument {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const document: IEditorDocument = {
      id,
      uri,
      language,
      content,
      isDirty: false,
      isReadonly: readonly,
      version: 1
    };

    this._documents.set(id, document);
    this._onDocumentCreated.fire(document);

    return document;
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): IEditorDocument | undefined {
    return this._documents.get(id);
  }

  /**
   * Get all documents
   */
  getDocuments(): IEditorDocument[] {
    return Array.from(this._documents.values());
  }

  /**
   * Update document content
   */
  updateDocument(id: string, content: string, changes: any[] = []): void {
    const document = this._documents.get(id);
    if (!document || document.isReadonly) {
      return;
    }

    // Create updated document
    const updatedDocument: IEditorDocument = {
      ...document,
      content,
      isDirty: true,
      version: document.version + 1
    };

    this._documents.set(id, updatedDocument);
    this._onDocumentChanged.fire({ document: updatedDocument, changes });
  }

  /**
   * Save document
   */
  async saveDocument(id: string): Promise<void> {
    const document = this._documents.get(id);
    if (!document || !document.isDirty) {
      return;
    }

    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 100));

    const savedDocument: IEditorDocument = {
      ...document,
      isDirty: false
    };

    this._documents.set(id, savedDocument);
    this._onDocumentSaved.fire(savedDocument);
  }

  /**
   * Close document
   */
  closeDocument(id: string): void {
    const document = this._documents.get(id);
    if (!document) {
      return;
    }

    // Close all tabs using this document
    for (const group of this._groups.values()) {
      const tabsToClose = group.tabs.filter(tab => tab.documentId === id);
      for (const tab of tabsToClose) {
        this.closeTab(tab.id);
      }
    }

    this._documents.delete(id);
    this._onDocumentClosed.fire(document);
  }

  /**
   * Create editor group
   */
  createGroup(id?: string): IEditorGroup {
    const groupId = id || `group-${Date.now()}`;
    
    const group: IEditorGroup = {
      id: groupId,
      tabs: [],
      activeTabId: undefined
    };

    this._groups.set(groupId, group);
    
    if (!this._activeGroupId) {
      this._activeGroupId = groupId;
    }

    this._onGroupCreated.fire(group);
    return group;
  }

  /**
   * Get group by ID
   */
  getGroup(id: string): IEditorGroup | undefined {
    return this._groups.get(id);
  }

  /**
   * Get all groups
   */
  getGroups(): IEditorGroup[] {
    return Array.from(this._groups.values());
  }

  /**
   * Get active group
   */
  getActiveGroup(): IEditorGroup | undefined {
    return this._activeGroupId ? this._groups.get(this._activeGroupId) : undefined;
  }

  /**
   * Set active group
   */
  setActiveGroup(id: string): void {
    if (this._groups.has(id)) {
      this._activeGroupId = id;
    }
  }

  /**
   * Open document in tab
   */
  openTab(documentId: string, groupId?: string): IEditorTab {
    const document = this._documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    const targetGroupId = groupId || this._activeGroupId || this.createGroup().id;
    const group = this._groups.get(targetGroupId);
    if (!group) {
      throw new Error(`Group not found: ${targetGroupId}`);
    }

    // Check if tab already exists
    const existingTab = group.tabs.find(tab => tab.documentId === documentId);
    if (existingTab) {
      this.activateTab(existingTab.id);
      return existingTab;
    }

    const tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const tab: IEditorTab = {
      id: tabId,
      title: this._getDocumentTitle(document),
      documentId,
      isActive: false,
      isPinned: false,
      isDirty: document.isDirty
    };

    // Add tab to group
    const updatedGroup: IEditorGroup = {
      ...group,
      tabs: [...group.tabs, tab]
    };

    this._groups.set(targetGroupId, updatedGroup);
    this._onTabOpened.fire(tab);

    // Activate the new tab
    this.activateTab(tabId);

    return tab;
  }

  /**
   * Close tab
   */
  closeTab(tabId: string): void {
    for (const [groupId, group] of this._groups.entries()) {
      const tabIndex = group.tabs.findIndex(tab => tab.id === tabId);
      if (tabIndex !== -1) {
        const tab = group.tabs[tabIndex];
        const updatedTabs = [...group.tabs];
        updatedTabs.splice(tabIndex, 1);

        // Update active tab if needed
        let newActiveTabId = group.activeTabId;
        if (tab.isActive && updatedTabs.length > 0) {
          newActiveTabId = updatedTabs[Math.max(0, tabIndex - 1)].id;
        } else if (tab.isActive) {
          newActiveTabId = undefined;
        }

        const updatedGroup: IEditorGroup = {
          ...group,
          tabs: updatedTabs,
          activeTabId: newActiveTabId
        };

        this._groups.set(groupId, updatedGroup);
        this._onTabClosed.fire(tab);

        // Activate new tab if needed
        if (newActiveTabId && newActiveTabId !== group.activeTabId) {
          this.activateTab(newActiveTabId);
        }

        break;
      }
    }
  }

  /**
   * Activate tab
   */
  activateTab(tabId: string): void {
    for (const [groupId, group] of this._groups.entries()) {
      const tab = group.tabs.find(t => t.id === tabId);
      if (tab) {
        // Deactivate all tabs in group
        const updatedTabs = group.tabs.map(t => ({
          ...t,
          isActive: t.id === tabId
        }));

        const updatedGroup: IEditorGroup = {
          ...group,
          tabs: updatedTabs,
          activeTabId: tabId
        };

        this._groups.set(groupId, updatedGroup);
        this._activeGroupId = groupId;
        
        this._onTabActivated.fire({ ...tab, isActive: true });
        break;
      }
    }
  }

  private _getDocumentTitle(document: IEditorDocument): string {
    const parts = document.uri.split('/');
    return parts[parts.length - 1] || 'Untitled';
  }
}

/**
 * Editor service identifier
 */
export const EDITOR_SERVICE_ID = 'editor';