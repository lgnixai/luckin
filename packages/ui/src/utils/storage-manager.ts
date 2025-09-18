import { EditorState, SessionData, Tab, EditorPane, StateError } from "@/types/obsidian-editor';

/**
 * 本地存储管理器
 * 负责编辑器状态的持久化存储和恢复
 */
export class StorageManager {
  private static readonly SESSION_KEY = 'obsidian-editor-session';
  private static readonly AUTO_SAVE_KEY = 'obsidian-editor-autosave';
  private static readonly BACKUP_KEY = 'obsidian-editor-backup';
  private static readonly VERSION = '1.1.0';
  
  private autoSaveTimer: NodeJS.Timeout | null = null;
  private autoSaveDelay: number = 2000; // 2秒延迟自动保存

  /**
   * 保存编辑器会话状态
   */
  async saveSession(state: EditorState): Promise<void> {
    try {
      const sessionData: SessionData = {
        tabs: this.serializeTabs(state.tabs),
        panes: state.panes,
        tabGroups: state.tabGroups || {},
        layout: state.layout,
        activePane: state.activePane,
        timestamp: Date.now(),
        version: StorageManager.VERSION
      };

      // 先保存备份
      await this.saveBackup(sessionData);
      
      // 保存主会话数据
      localStorage.setItem(StorageManager.SESSION_KEY, JSON.stringify(sessionData));
      
      console.log('Session saved successfully');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new StateError('storage', 'Failed to save session state', false);
    }
  }

  /**
   * 加载编辑器会话状态
   */
  async loadSession(): Promise<Partial<EditorState> | null> {
    try {
      const sessionData = localStorage.getItem(StorageManager.SESSION_KEY);
      if (!sessionData) {
        return null;
      }

      const parsed: SessionData = JSON.parse(sessionData);
      
      // 验证版本兼容性
      if (!this.isVersionCompatible(parsed.version)) {
        console.warn('Session version incompatible, attempting migration');
        const migrated = await this.migrateSession(parsed);
        if (!migrated) {
          throw new StateError('version', 'Session version incompatible and migration failed', false);
        }
        return migrated;
      }

      // 反序列化标签页数据
      const deserializedTabs = this.deserializeTabs(parsed.tabs);
      
      return {
        tabs: deserializedTabs,
        panes: parsed.panes,
        tabGroups: parsed.tabGroups || {},
        layout: parsed.layout,
        activePane: parsed.activePane
      };
    } catch (error) {
      console.error('Failed to load session:', error);
      
      // 尝试从备份恢复
      const backup = await this.loadBackup();
      if (backup) {
        console.log('Attempting to restore from backup');
        return backup;
      }
      
      throw new StateError('corruption', 'Session data corrupted and no backup available', false);
    }
  }

  /**
   * 清除会话数据
   */
  async clearSession(): Promise<void> {
    try {
      localStorage.removeItem(StorageManager.SESSION_KEY);
      localStorage.removeItem(StorageManager.AUTO_SAVE_KEY);
      localStorage.removeItem(StorageManager.BACKUP_KEY);
      
      if (this.autoSaveTimer) {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = null;
      }
      
      console.log('Session cleared successfully');
    } catch (error) {
      console.error('Failed to clear session:', error);
      throw new StateError('storage', 'Failed to clear session data', false);
    }
  }

  /**
   * 自动保存文件内容
   */
  async autoSaveContent(tabId: string, content: string): Promise<void> {
    try {
      const autoSaveData = this.getAutoSaveData();
      autoSaveData[tabId] = {
        content,
        timestamp: Date.now()
      };
      
      localStorage.setItem(StorageManager.AUTO_SAVE_KEY, JSON.stringify(autoSaveData));
      
      console.log(`Auto-saved content for tab ${tabId}`);
    } catch (error) {
      console.error('Failed to auto-save content:', error);
    }
  }

  /**
   * 获取自动保存的内容
   */
  async getAutoSavedContent(tabId: string): Promise<string | null> {
    try {
      const autoSaveData = this.getAutoSaveData();
      const saved = autoSaveData[tabId];
      
      if (saved && Date.now() - saved.timestamp < 24 * 60 * 60 * 1000) { // 24小时内有效
        return saved.content;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get auto-saved content:', error);
      return null;
    }
  }

  /**
   * 清理过期的自动保存数据
   */
  async cleanupAutoSave(): Promise<void> {
    try {
      const autoSaveData = this.getAutoSaveData();
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7天
      
      Object.keys(autoSaveData).forEach(tabId => {
        if (now - autoSaveData[tabId].timestamp > maxAge) {
          delete autoSaveData[tabId];
        }
      });
      
      localStorage.setItem(StorageManager.AUTO_SAVE_KEY, JSON.stringify(autoSaveData));
    } catch (error) {
      console.error('Failed to cleanup auto-save data:', error);
    }
  }

  /**
   * 启动自动保存
   */
  startAutoSave(callback: () => EditorState): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    this.autoSaveTimer = setTimeout(async () => {
      try {
        const state = callback();
        await this.saveSession(state);
        
        // 继续下一次自动保存
        this.startAutoSave(callback);
      } catch (error) {
        console.error('Auto-save failed:', error);
        // 重试自动保存
        this.startAutoSave(callback);
      }
    }, this.autoSaveDelay);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 设置自动保存延迟
   */
  setAutoSaveDelay(delay: number): void {
    this.autoSaveDelay = Math.max(1000, delay); // 最小1秒
  }

  /**
   * 检查存储空间
   */
  async checkStorageSpace(): Promise<{ available: boolean; usage?: number; quota?: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = usage < quota * 0.9; // 使用率低于90%认为可用
        
        return { available, usage, quota };
      }
      
      // 降级检查：尝试写入测试数据
      const testKey = 'storage-test';
      const testData = 'x'.repeat(1024); // 1KB测试数据
      
      try {
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        return { available: true };
      } catch {
        return { available: false };
      }
    } catch (error) {
      console.error('Failed to check storage space:', error);
      return { available: false };
    }
  }

  /**
   * 序列化标签页数据
   */
  private serializeTabs(tabs: Record<string, Tab>): Record<string, Tab> {
    const serialized: Record<string, Tab> = {};
    
    Object.entries(tabs).forEach(([id, tab]) => {
      serialized[id] = {
        ...tab,
        createdAt: tab.createdAt,
        modifiedAt: tab.modifiedAt
      };
    });
    
    return serialized;
  }

  /**
   * 反序列化标签页数据
   */
  private deserializeTabs(tabs: Record<string, Tab>): Record<string, Tab> {
    const deserialized: Record<string, Tab> = {};
    
    Object.entries(tabs).forEach(([id, tab]) => {
      deserialized[id] = {
        ...tab,
        createdAt: new Date(tab.createdAt),
        modifiedAt: new Date(tab.modifiedAt)
      };
    });
    
    return deserialized;
  }

  /**
   * 保存备份数据
   */
  private async saveBackup(sessionData: SessionData): Promise<void> {
    try {
      const backups = this.getBackups();
      
      // 保留最近3个备份
      if (backups.length >= 3) {
        backups.shift();
      }
      
      backups.push({
        ...sessionData,
        backupTimestamp: Date.now()
      });
      
      localStorage.setItem(StorageManager.BACKUP_KEY, JSON.stringify(backups));
    } catch (error) {
      console.error('Failed to save backup:', error);
    }
  }

  /**
   * 加载备份数据
   */
  private async loadBackup(): Promise<Partial<EditorState> | null> {
    try {
      const backups = this.getBackups();
      if (backups.length === 0) {
        return null;
      }
      
      // 使用最新的备份
      const latestBackup = backups[backups.length - 1];
      
      return {
        tabs: this.deserializeTabs(latestBackup.tabs),
        panes: latestBackup.panes,
        tabGroups: latestBackup.tabGroups || {},
        layout: latestBackup.layout,
        activePane: latestBackup.activePane
      };
    } catch (error) {
      console.error('Failed to load backup:', error);
      return null;
    }
  }

  /**
   * 获取备份列表
   */
  private getBackups(): Array<SessionData & { backupTimestamp: number }> {
    try {
      const backupData = localStorage.getItem(StorageManager.BACKUP_KEY);
      return backupData ? JSON.parse(backupData) : [];
    } catch {
      return [];
    }
  }

  /**
   * 获取自动保存数据
   */
  private getAutoSaveData(): Record<string, { content: string; timestamp: number }> {
    try {
      const autoSaveData = localStorage.getItem(StorageManager.AUTO_SAVE_KEY);
      return autoSaveData ? JSON.parse(autoSaveData) : {};
    } catch {
      return {};
    }
  }

  /**
   * 检查版本兼容性
   */
  private isVersionCompatible(version: string): boolean {
    const currentVersion = StorageManager.VERSION;
    const [currentMajor] = currentVersion.split('.').map(Number);
    const [savedMajor] = version.split('.').map(Number);
    
    // 主版本号相同认为兼容
    return currentMajor === savedMajor;
  }

  /**
   * 迁移会话数据
   */
  private async migrateSession(sessionData: SessionData): Promise<Partial<EditorState> | null> {
    try {
      // 这里可以添加版本迁移逻辑
      // 目前只是简单的数据清理和验证
      
      const migratedTabs: Record<string, Tab> = {};
      const migratedPanes: Record<string, EditorPane> = {};
      const migratedTabGroups: EditorState['tabGroups'] = {};
      
      // 迁移标签页数据
      Object.entries(sessionData.tabs || {}).forEach(([id, tab]) => {
        if (tab && typeof tab === 'object' && tab.id && tab.title) {
          migratedTabs[id] = {
            id: tab.id,
            title: tab.title,
            content: tab.content || '',
            isDirty: Boolean(tab.isDirty),
            isLocked: Boolean(tab.isLocked),
            type: tab.type || 'file',
            filePath: tab.filePath,
            language: tab.language,
            encoding: tab.encoding,
            lineEnding: tab.lineEnding,
            createdAt: new Date(tab.createdAt || Date.now()),
            modifiedAt: new Date(tab.modifiedAt || Date.now())
          };
        }
      });
      
      // 迁移面板数据
      Object.entries(sessionData.panes || {}).forEach(([id, pane]) => {
        if (pane && typeof pane === 'object' && pane.id) {
          migratedPanes[id] = {
            id: pane.id,
            tabs: Array.isArray(pane.tabs) ? pane.tabs : [],
            activeTab: pane.activeTab || '',
            position: pane.position || { x: 0, y: 0, width: 800, height: 600 },
            splitDirection: pane.splitDirection,
            parentPane: pane.parentPane,
            childPanes: pane.childPanes
          };
        }
      });
      
      // 迁移标签组数据（1.1.0 新增）
      Object.entries((sessionData as any).tabGroups || {}).forEach(([id, group]) => {
        if (group && typeof group === 'object' && (group as any).id) {
          migratedTabGroups[id] = {
            id: (group as any).id,
            name: (group as any).name || '',
            color: (group as any).color || '#999999',
            tabs: Array.isArray((group as any).tabs) ? (group as any).tabs : [],
            createdAt: new Date((group as any).createdAt || Date.now())
          } as any;
        }
      });
      
      return {
        tabs: migratedTabs,
        panes: migratedPanes,
        tabGroups: migratedTabGroups,
        layout: sessionData.layout || { type: 'single', panes: [], splitters: [], activePane: '' },
        activePane: sessionData.activePane || ''
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return null;
    }
  }
}

/**
 * 状态错误类
 */
class StateError extends Error {
  constructor(
    public type: 'corruption' | 'version' | 'storage',
    message: string,
    public recoverable: boolean
  ) {
    super(message);
    this.name = 'StateError';
  }
}

// 导出单例实例
export const storageManager = new StorageManager();