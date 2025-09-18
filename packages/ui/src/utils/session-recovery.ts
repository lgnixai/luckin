import { EditorState, Tab, EditorPane, StateError } from "@/types/obsidian-editor';
import { storageManager } from "@/components/storage-manager";
import { generateId, createDefaultTab, createDefaultPane, createDefaultSettings } from "@/components/obsidian-editor-utils";

/**
 * 会话恢复服务
 * 处理各种会话恢复场景和错误情况
 */
export class SessionRecoveryService {
  private recoveryAttempts = 0;
  private maxRecoveryAttempts = 3;
  
  /**
   * 恢复编辑器会话
   */
  async recoverSession(): Promise<{
    state: Partial<EditorState>;
    recovered: boolean;
    errors: StateError[];
    warnings: string[];
  }> {
    const errors: StateError[] = [];
    const warnings: string[] = [];
    let recovered = false;
    let state: Partial<EditorState> = {};

    try {
      // 尝试加载主会话数据
      const sessionState = await storageManager.loadSession();
      
      if (sessionState) {
        // 验证和修复会话数据
        const validationResult = await this.validateAndRepairSession(sessionState);
        
        if (validationResult.isValid) {
          state = validationResult.state;
          recovered = true;
          warnings.push(...validationResult.warnings);
        } else {
          errors.push(...validationResult.errors);
          warnings.push('Session data validation failed, attempting alternative recovery');
          
          // 尝试部分恢复
          const partialRecovery = await this.attemptPartialRecovery(sessionState);
          if (partialRecovery.recovered) {
            state = partialRecovery.state;
            recovered = true;
            warnings.push('Partial session recovery successful');
            warnings.push(...partialRecovery.warnings);
          }
        }
      }
    } catch (error) {
      console.error('Session recovery failed:', error);
      errors.push(error instanceof StateError ? error : 
        new StateError('corruption', 'Failed to load session data', true));
    }

    // 如果主恢复失败，尝试其他恢复策略
    if (!recovered) {
      const fallbackResult = await this.attemptFallbackRecovery();
      state = fallbackResult.state;
      recovered = fallbackResult.recovered;
      warnings.push(...fallbackResult.warnings);
      errors.push(...fallbackResult.errors);
    }

    // 如果仍然没有恢复成功，创建默认状态
    if (!recovered) {
      state = this.createDefaultState();
      warnings.push('Created default editor state');
    }

    // 恢复自动保存的内容
    await this.recoverAutoSavedContent(state);

    return { state, recovered, errors, warnings };
  }

  /**
   * 验证和修复会话数据
   */
  private async validateAndRepairSession(sessionState: Partial<EditorState>): Promise<{
    isValid: boolean;
    state: Partial<EditorState>;
    errors: StateError[];
    warnings: string[];
  }> {
    const errors: StateError[] = [];
    const warnings: string[] = [];
    const repairedState: Partial<EditorState> = { ...sessionState };

    try {
      // 验证标签页数据
      if (sessionState.tabs) {
        const { validTabs, invalidCount } = this.validateTabs(sessionState.tabs);
        repairedState.tabs = validTabs;
        
        if (invalidCount > 0) {
          warnings.push(`Removed ${invalidCount} invalid tabs`);
        }
      }

      // 验证面板数据
      if (sessionState.panes) {
        const { validPanes, invalidCount } = this.validatePanes(sessionState.panes, repairedState.tabs || {});
        repairedState.panes = validPanes;
        
        if (invalidCount > 0) {
          warnings.push(`Removed ${invalidCount} invalid panes`);
        }
      }

      // 验证布局数据
      if (sessionState.layout) {
        const layoutValidation = this.validateLayout(sessionState.layout, repairedState.panes || {});
        repairedState.layout = layoutValidation.layout;
        warnings.push(...layoutValidation.warnings);
      }

      // 验证活动面板
      if (sessionState.activePane && repairedState.panes) {
        if (!repairedState.panes[sessionState.activePane]) {
          const paneIds = Object.keys(repairedState.panes);
          repairedState.activePane = paneIds[0] || '';
          warnings.push('Active pane was invalid, switched to first available pane');
        }
      }

      // 确保至少有一个面板和标签页
      if (!repairedState.panes || Object.keys(repairedState.panes).length === 0) {
        const defaultPane = this.createDefaultPane();
        const defaultTab = this.createDefaultTab();
        
        repairedState.panes = { [defaultPane.id]: defaultPane };
        repairedState.tabs = { [defaultTab.id]: defaultTab };
        repairedState.activePane = defaultPane.id;
        
        defaultPane.tabs = [defaultTab.id];
        defaultPane.activeTab = defaultTab.id;
        
        warnings.push('Created default pane and tab');
      }

      return {
        isValid: errors.length === 0,
        state: repairedState,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(new StateError('corruption', 'Session validation failed', true));
      return {
        isValid: false,
        state: repairedState,
        errors,
        warnings
      };
    }
  }

  /**
   * 验证标签页数据
   */
  private validateTabs(tabs: Record<string, Tab>): {
    validTabs: Record<string, Tab>;
    invalidCount: number;
  } {
    const validTabs: Record<string, Tab> = {};
    let invalidCount = 0;

    Object.entries(tabs).forEach(([id, tab]) => {
      if (this.isValidTab(tab)) {
        // 修复可能的数据问题
        validTabs[id] = {
          ...tab,
          id: tab.id || id,
          title: tab.title || 'Untitled',
          content: tab.content || '',
          isDirty: Boolean(tab.isDirty),
          isLocked: Boolean(tab.isLocked),
          type: tab.type || 'file',
          createdAt: tab.createdAt instanceof Date ? tab.createdAt : new Date(tab.createdAt || Date.now()),
          modifiedAt: tab.modifiedAt instanceof Date ? tab.modifiedAt : new Date(tab.modifiedAt || Date.now())
        };
      } else {
        invalidCount++;
      }
    });

    return { validTabs, invalidCount };
  }

  /**
   * 验证面板数据
   */
  private validatePanes(panes: Record<string, EditorPane>, validTabs: Record<string, Tab>): {
    validPanes: Record<string, EditorPane>;
    invalidCount: number;
  } {
    const validPanes: Record<string, EditorPane> = {};
    let invalidCount = 0;

    Object.entries(panes).forEach(([id, pane]) => {
      if (this.isValidPane(pane)) {
        // 过滤无效的标签页引用
        const validTabIds = pane.tabs.filter(tabId => validTabs[tabId]);
        
        if (validTabIds.length > 0) {
          validPanes[id] = {
            ...pane,
            id: pane.id || id,
            tabs: validTabIds,
            activeTab: validTabIds.includes(pane.activeTab) ? pane.activeTab : validTabIds[0],
            position: pane.position || { x: 0, y: 0, width: 800, height: 600 }
          };
        } else {
          invalidCount++;
        }
      } else {
        invalidCount++;
      }
    });

    return { validPanes, invalidCount };
  }

  /**
   * 验证布局数据
   */
  private validateLayout(layout: any, validPanes: Record<string, EditorPane>): {
    layout: any;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const validatedLayout = { ...layout };

    // 验证面板引用
    if (layout.panes) {
      const validPaneRefs = layout.panes.filter((pane: any) => validPanes[pane.id]);
      if (validPaneRefs.length !== layout.panes.length) {
        warnings.push('Removed invalid pane references from layout');
      }
      validatedLayout.panes = validPaneRefs;
    }

    // 验证分割器
    if (layout.splitters) {
      const validSplitters = layout.splitters.filter((splitter: any) => 
        validPanes[splitter.paneA] && validPanes[splitter.paneB]
      );
      if (validSplitters.length !== layout.splitters.length) {
        warnings.push('Removed invalid splitters from layout');
      }
      validatedLayout.splitters = validSplitters;
    }

    // 验证活动面板
    if (layout.activePane && !validPanes[layout.activePane]) {
      const paneIds = Object.keys(validPanes);
      validatedLayout.activePane = paneIds[0] || '';
      warnings.push('Layout active pane was invalid, switched to first available');
    }

    return { layout: validatedLayout, warnings };
  }

  /**
   * 尝试部分恢复
   */
  private async attemptPartialRecovery(sessionState: Partial<EditorState>): Promise<{
    recovered: boolean;
    state: Partial<EditorState>;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const partialState: Partial<EditorState> = {};

    try {
      // 尝试恢复标签页内容
      if (sessionState.tabs) {
        const recoveredTabs: Record<string, Tab> = {};
        
        Object.entries(sessionState.tabs).forEach(([id, tab]) => {
          if (tab && tab.title) {
            recoveredTabs[id] = {
              id: id,
              title: tab.title,
              content: tab.content || '',
              isDirty: false,
              isLocked: false,
              type: 'file',
              createdAt: new Date(),
              modifiedAt: new Date()
            };
          }
        });

        if (Object.keys(recoveredTabs).length > 0) {
          partialState.tabs = recoveredTabs;
          warnings.push(`Partially recovered ${Object.keys(recoveredTabs).length} tabs`);
        }
      }

      // 创建默认面板结构
      if (partialState.tabs && Object.keys(partialState.tabs).length > 0) {
        const defaultPane = this.createDefaultPane();
        const tabIds = Object.keys(partialState.tabs);
        
        defaultPane.tabs = tabIds;
        defaultPane.activeTab = tabIds[0];
        
        partialState.panes = { [defaultPane.id]: defaultPane };
        partialState.activePane = defaultPane.id;
        partialState.layout = {
          type: 'single',
          panes: [defaultPane],
          splitters: [],
          activePane: defaultPane.id
        };

        return { recovered: true, state: partialState, warnings };
      }
    } catch (error) {
      console.error('Partial recovery failed:', error);
    }

    return { recovered: false, state: {}, warnings };
  }

  /**
   * 尝试后备恢复策略
   */
  private async attemptFallbackRecovery(): Promise<{
    recovered: boolean;
    state: Partial<EditorState>;
    warnings: string[];
    errors: StateError[];
  }> {
    const warnings: string[] = [];
    const errors: StateError[] = [];

    try {
      // 检查是否有自动保存的内容
      const autoSaveData = await this.getAutoSaveData();
      
      if (autoSaveData && Object.keys(autoSaveData).length > 0) {
        const recoveredTabs: Record<string, Tab> = {};
        
        Object.entries(autoSaveData).forEach(([tabId, data]) => {
          recoveredTabs[tabId] = {
            id: tabId,
            title: `Recovered ${tabId.slice(0, 8)}`,
            content: data.content,
            isDirty: true,
            isLocked: false,
            type: 'file',
            createdAt: new Date(data.timestamp),
            modifiedAt: new Date(data.timestamp)
          };
        });

        const defaultPane = this.createDefaultPane();
        const tabIds = Object.keys(recoveredTabs);
        
        defaultPane.tabs = tabIds;
        defaultPane.activeTab = tabIds[0];

        const state: Partial<EditorState> = {
          tabs: recoveredTabs,
          panes: { [defaultPane.id]: defaultPane },
          activePane: defaultPane.id,
          layout: {
            type: 'single',
            panes: [defaultPane],
            splitters: [],
            activePane: defaultPane.id
          }
        };

        warnings.push(`Recovered ${tabIds.length} tabs from auto-save data`);
        return { recovered: true, state, warnings, errors };
      }
    } catch (error) {
      errors.push(new StateError('storage', 'Fallback recovery failed', false));
    }

    return { recovered: false, state: {}, warnings, errors };
  }

  /**
   * 恢复自动保存的内容
   */
  private async recoverAutoSavedContent(state: Partial<EditorState>): Promise<void> {
    if (!state.tabs) return;

    try {
      for (const [tabId, tab] of Object.entries(state.tabs)) {
        const autoSavedContent = await storageManager.getAutoSavedContent(tabId);
        
        if (autoSavedContent && autoSavedContent !== tab.content) {
          // 如果自动保存的内容更新，提示用户
          tab.content = autoSavedContent;
          tab.isDirty = true;
          tab.title = `${tab.title} (Auto-recovered)`;
        }
      }
    } catch (error) {
      console.error('Failed to recover auto-saved content:', error);
    }
  }

  /**
   * 获取自动保存数据
   */
  private async getAutoSaveData(): Promise<Record<string, { content: string; timestamp: number }> | null> {
    try {
      const autoSaveData = localStorage.getItem('obsidian-editor-autosave');
      return autoSaveData ? JSON.parse(autoSaveData) : null;
    } catch {
      return null;
    }
  }

  /**
   * 创建默认状态
   */
  private createDefaultState(): Partial<EditorState> {
    const defaultPane = this.createDefaultPane();
    const defaultTab = this.createDefaultTab();
    
    defaultPane.tabs = [defaultTab.id];
    defaultPane.activeTab = defaultTab.id;

    return {
      tabs: { [defaultTab.id]: defaultTab },
      panes: { [defaultPane.id]: defaultPane },
      activePane: defaultPane.id,
      layout: {
        type: 'single',
        panes: [defaultPane],
        splitters: [],
        activePane: defaultPane.id
      },
      recentFiles: [],
      settings: createDefaultSettings()
    };
  }

  /**
   * 创建默认面板
   */
  private createDefaultPane(): EditorPane {
    return createDefaultPane({ id: generateId() });
  }

  /**
   * 创建默认标签页
   */
  private createDefaultTab(): Tab {
    return createDefaultTab({ 
      id: generateId(),
      title: 'Welcome',
      type: 'welcome'
    });
  }

  /**
   * 验证标签页是否有效
   */
  private isValidTab(tab: any): boolean {
    return tab && 
           typeof tab === 'object' && 
           typeof tab.id === 'string' && 
           typeof tab.title === 'string' &&
           typeof tab.content === 'string';
  }

  /**
   * 验证面板是否有效
   */
  private isValidPane(pane: any): boolean {
    return pane && 
           typeof pane === 'object' && 
           typeof pane.id === 'string' && 
           Array.isArray(pane.tabs) &&
           typeof pane.activeTab === 'string';
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
export const sessionRecoveryService = new SessionRecoveryService();