import { Tab, EditorSettings } from "@/types/obsidian-editor';
import { storageManager } from "@/components/storage-manager";

/**
 * 自动保存服务
 * 处理文件内容的自动保存和恢复
 */
export class AutoSaveService {
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingSaves: Set<string> = new Set();
  private isEnabled: boolean = true;
  private defaultDelay: number = 2000; // 2秒默认延迟

  /**
   * 启用自动保存
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 禁用自动保存
   */
  disable(): void {
    this.isEnabled = false;
    this.clearAllTimers();
  }

  /**
   * 检查自动保存是否启用
   */
  isAutoSaveEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 设置默认自动保存延迟
   */
  setDefaultDelay(delay: number): void {
    this.defaultDelay = Math.max(500, delay); // 最小500ms
  }

  /**
   * 获取默认延迟
   */
  getDefaultDelay(): number {
    return this.defaultDelay;
  }

  /**
   * 触发标签页内容的自动保存
   */
  triggerAutoSave(tab: Tab, settings?: EditorSettings): void {
    if (!this.isEnabled || !tab.isDirty) {
      return;
    }

    const delay = settings?.autoSaveDelay || this.defaultDelay;
    
    // 清除之前的定时器
    this.clearTimer(tab.id);
    
    // 设置新的自动保存定时器
    const timer = setTimeout(async () => {
      await this.performAutoSave(tab);
    }, delay);
    
    this.autoSaveTimers.set(tab.id, timer);
  }

  /**
   * 立即保存标签页内容
   */
  async saveImmediately(tab: Tab): Promise<boolean> {
    this.clearTimer(tab.id);
    return await this.performAutoSave(tab);
  }

  /**
   * 批量保存所有待保存的标签页
   */
  async saveAll(tabs: Record<string, Tab>): Promise<{ saved: string[]; failed: string[] }> {
    const saved: string[] = [];
    const failed: string[] = [];

    const dirtyTabs = Object.values(tabs).filter(tab => tab.isDirty);
    
    for (const tab of dirtyTabs) {
      try {
        const success = await this.performAutoSave(tab);
        if (success) {
          saved.push(tab.id);
        } else {
          failed.push(tab.id);
        }
      } catch (error) {
        console.error(`Failed to save tab ${tab.id}:`, error);
        failed.push(tab.id);
      }
    }

    return { saved, failed };
  }

  /**
   * 取消标签页的自动保存
   */
  cancelAutoSave(tabId: string): void {
    this.clearTimer(tabId);
    this.pendingSaves.delete(tabId);
  }

  /**
   * 清理所有自动保存定时器
   */
  cleanup(): void {
    this.clearAllTimers();
    this.pendingSaves.clear();
  }

  /**
   * 获取待保存的标签页列表
   */
  getPendingSaves(): string[] {
    return Array.from(this.pendingSaves);
  }

  /**
   * 检查标签页是否有待保存的更改
   */
  hasPendingSave(tabId: string): boolean {
    return this.pendingSaves.has(tabId) || this.autoSaveTimers.has(tabId);
  }

  /**
   * 恢复自动保存的内容
   */
  async recoverAutoSavedContent(tabId: string): Promise<{
    content: string | null;
    timestamp: number | null;
    hasRecovery: boolean;
  }> {
    try {
      const content = await storageManager.getAutoSavedContent(tabId);
      
      if (content) {
        // 获取保存时间戳
        const autoSaveData = this.getAutoSaveData();
        const timestamp = autoSaveData[tabId]?.timestamp || null;
        
        return {
          content,
          timestamp,
          hasRecovery: true
        };
      }
      
      return {
        content: null,
        timestamp: null,
        hasRecovery: false
      };
    } catch (error) {
      console.error('Failed to recover auto-saved content:', error);
      return {
        content: null,
        timestamp: null,
        hasRecovery: false
      };
    }
  }

  /**
   * 清理过期的自动保存数据
   */
  async cleanupExpiredAutoSaves(): Promise<void> {
    try {
      await storageManager.cleanupAutoSave();
    } catch (error) {
      console.error('Failed to cleanup expired auto-saves:', error);
    }
  }

  /**
   * 获取自动保存统计信息
   */
  getAutoSaveStats(): {
    activeTimers: number;
    pendingSaves: number;
    isEnabled: boolean;
    defaultDelay: number;
  } {
    return {
      activeTimers: this.autoSaveTimers.size,
      pendingSaves: this.pendingSaves.size,
      isEnabled: this.isEnabled,
      defaultDelay: this.defaultDelay
    };
  }

  /**
   * 执行自动保存
   */
  private async performAutoSave(tab: Tab): Promise<boolean> {
    if (this.pendingSaves.has(tab.id)) {
      return false; // 已经在保存中
    }

    this.pendingSaves.add(tab.id);

    try {
      // 保存到本地存储
      await storageManager.autoSaveContent(tab.id, tab.content);
      
      // 如果有文件路径，尝试保存到文件系统
      if (tab.filePath) {
        await this.saveToFileSystem(tab);
      }

      console.log(`Auto-saved tab ${tab.id}: ${tab.title}`);
      return true;
    } catch (error) {
      console.error(`Auto-save failed for tab ${tab.id}:`, error);
      return false;
    } finally {
      this.pendingSaves.delete(tab.id);
      this.autoSaveTimers.delete(tab.id);
    }
  }

  /**
   * 保存到文件系统（模拟）
   */
  private async saveToFileSystem(tab: Tab): Promise<void> {
    // 这里应该调用实际的文件系统API
    // 目前只是模拟保存过程
    
    return new Promise((resolve, reject) => {
      // 模拟异步文件保存
      setTimeout(() => {
        try {
          // 在实际实现中，这里会调用文件系统API
          // await fileSystem.writeFile(tab.filePath, tab.content);
          
          console.log(`File saved: ${tab.filePath}`);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 100);
    });
  }

  /**
   * 清除指定标签页的定时器
   */
  private clearTimer(tabId: string): void {
    const timer = this.autoSaveTimers.get(tabId);
    if (timer) {
      clearTimeout(timer);
      this.autoSaveTimers.delete(tabId);
    }
  }

  /**
   * 清除所有定时器
   */
  private clearAllTimers(): void {
    this.autoSaveTimers.forEach(timer => clearTimeout(timer));
    this.autoSaveTimers.clear();
  }

  /**
   * 获取自动保存数据
   */
  private getAutoSaveData(): Record<string, { content: string; timestamp: number }> {
    try {
      const data = localStorage.getItem('obsidian-editor-autosave');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }
}

/**
 * 自动保存配置接口
 */
export interface AutoSaveConfig {
  enabled: boolean;
  delay: number;
  saveOnFocusLoss: boolean;
  saveOnTabSwitch: boolean;
  maxRetries: number;
  retryDelay: number;
}

/**
 * 默认自动保存配置
 */
export const defaultAutoSaveConfig: AutoSaveConfig = {
  enabled: true,
  delay: 2000,
  saveOnFocusLoss: true,
  saveOnTabSwitch: true,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * 自动保存事件类型
 */
export interface AutoSaveEvents {
  onAutoSaveStart: (tabId: string) => void;
  onAutoSaveSuccess: (tabId: string) => void;
  onAutoSaveError: (tabId: string, error: Error) => void;
  onAutoSaveRecovery: (tabId: string, content: string) => void;
}

// 导出单例实例
export const autoSaveService = new AutoSaveService();