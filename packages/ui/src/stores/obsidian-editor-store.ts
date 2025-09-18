import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  EditorState, 
  Tab, 
  EditorPane, 
  EditorSettings,
  PaneSplitter,
  StateError,
  TabGroup
} from "@/types/obsidian-editor';
import { generateId, createDefaultTab, createDefaultPane, createDefaultSettings } from "@/utils/obsidian-editor-utils';
import { storageManager } from "@/utils/storage-manager';
import { sessionRecoveryService } from "@/utils/session-recovery';
import { autoSaveService } from "@/utils/auto-save-service';

interface EditorActions {
  // Tab 操作
  createTab: (options?: Partial<Tab>, paneId?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string, paneId?: string) => void;
  updateTab: (tabId: string, updates: Partial<Tab>) => void;
  moveTab: (tabId: string, fromPane: string, toPane: string, index?: number) => void;
  duplicateTab: (tabId: string) => string;
  lockTab: (tabId: string, locked: boolean) => void;
  reorderTab: (tabId: string, paneId: string, newIndex: number) => void;
  
  // Pane 操作
  createPane: (options?: Partial<EditorPane>) => string;
  closePane: (paneId: string) => void;
  activatePane: (paneId: string) => void;
  splitPane: (paneId: string, direction: 'horizontal' | 'vertical') => string;
  splitPaneWithTab: (tabId: string, direction: 'horizontal' | 'vertical') => string;
  resizePane: (paneId: string, width: number, height: number) => void;
  mergePanes: (paneAId: string, paneBId: string) => void;
  canMergePanes: (paneAId: string, paneBId: string) => boolean;
  getPaneMinSize: () => { width: number; height: number };
  validatePaneSize: (paneId: string, width: number, height: number) => boolean;
  autoMergePanes: () => void;
  
  // 布局操作
  createSplit: (paneAId: string, paneBId: string, direction: 'horizontal' | 'vertical') => string;
  removeSplit: (splitterId: string) => void;
  resizeSplit: (splitterId: string, position: number) => void;
  
  // 拖拽操作
  startDrag: (tabId: string, fromPane: string) => void;
  updateDrag: (dragOverPane?: string, position?: any) => void;
  endDrag: () => void;
  
  // 文件操作
  openFile: (filePath: string, content?: string) => string;
  saveFile: (tabId: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  
  // 设置操作
  updateSettings: (settings: Partial<EditorSettings>) => void;
  
  // 持久化操作
  saveSession: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearSession: () => Promise<void>;
  recoverSession: () => Promise<{ recovered: boolean; errors: StateError[]; warnings: string[] }>;
  
  // 自动保存操作
  enableAutoSave: () => void;
  disableAutoSave: () => void;
  triggerAutoSave: (tabId: string) => void;
  saveImmediately: (tabId: string) => Promise<boolean>;
  recoverAutoSavedContent: (tabId: string) => Promise<{ content: string | null; timestamp: number | null; hasRecovery: boolean }>;
  
  // Tab Groups 操作
  createTabGroup: (name: string, color: string, tabIds?: string[]) => string;
  deleteTabGroup: (groupId: string) => void;
  addTabToGroup: (tabId: string, groupId: string) => void;
  removeTabFromGroup: (tabId: string) => void;
  updateTabGroup: (groupId: string, updates: Partial<TabGroup>) => void;
  
  // Related Tabs 操作
  linkTabs: (tabId1: string, tabId2: string) => void;
  unlinkTabs: (tabId1: string, tabId2: string) => void;
  getRelatedTabs: (tabId: string) => Tab[];
  findRelatedFiles: (filePath: string) => string[];
  
  // Advanced Tab 操作
  moveTabToNewWindow: (tabId: string) => void;
  
  // 工具方法
  getActiveTab: () => Tab | undefined;
  getActivePane: () => EditorPane | undefined;
  getTabsByPane: (paneId: string) => Tab[];
  getPaneById: (paneId: string) => EditorPane | undefined;
  getTabById: (tabId: string) => Tab | undefined;
  getTabGroupById: (groupId: string) => TabGroup | undefined;
  getTabsByGroup: (groupId: string) => Tab[];
}

type EditorStore = EditorState & EditorActions;

const initialState: EditorState = {
  panes: {},
  tabs: {},
  tabGroups: {},
  layout: {
    type: 'single',
    panes: [],
    splitters: [],
    activePane: ''
  },
  recentFiles: [],
  settings: createDefaultSettings(),
  activePane: '',
  dragState: undefined
};

export const useObsidianEditorStore = create<EditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Tab 操作
      createTab: (options = {}, paneId) => {
        const tabId = generateId();
        const tab = createDefaultTab({ id: tabId, ...options });
        
        set((state) => {
          state.tabs[tabId] = tab;
          
          // 确定要添加到哪个面板
          let targetPaneId = paneId || state.activePane;
          
          // 如果没有面板，创建一个默认面板
          if (!targetPaneId || !state.panes[targetPaneId]) {
            const newPaneId = generateId();
            const newPane = createDefaultPane({ id: newPaneId });
            state.panes[newPaneId] = newPane;
            state.layout.panes.push(newPane);
            state.activePane = newPaneId;
            targetPaneId = newPaneId;
          }
          
          // 添加标签页到面板
          state.panes[targetPaneId].tabs.push(tabId);
          state.panes[targetPaneId].activeTab = tabId;
        });
        
        return tabId;
      },

      closeTab: (tabId) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (!tab) return;
          
          // 找到包含此标签页的面板
          const paneId = Object.keys(state.panes).find(id => 
            state.panes[id].tabs.includes(tabId)
          );
          
          if (paneId) {
            const pane = state.panes[paneId];
            const tabIndex = pane.tabs.indexOf(tabId);
            
            // 从面板中移除标签页
            pane.tabs.splice(tabIndex, 1);
            
            // 如果关闭的是活动标签页，切换到其他标签页
            if (pane.activeTab === tabId) {
              if (pane.tabs.length > 0) {
                // 优先选择右边的标签页，如果没有则选择左边的
                const newActiveIndex = Math.min(tabIndex, pane.tabs.length - 1);
                pane.activeTab = pane.tabs[newActiveIndex];
              } else {
                pane.activeTab = '';
              }
            }
            
            // 如果面板没有标签页了，考虑关闭面板
            if (pane.tabs.length === 0 && Object.keys(state.panes).length > 1) {
              delete state.panes[paneId];
              state.layout.panes = state.layout.panes.filter(p => p.id !== paneId);
              
              // 如果关闭的是活动面板，切换到其他面板
              if (state.activePane === paneId) {
                const remainingPanes = Object.keys(state.panes);
                state.activePane = remainingPanes[0] || '';
              }
            }
          }
          
          // 删除标签页
          delete state.tabs[tabId];
          
          // 更新最近文件列表
          if (tab.filePath) {
            const recentIndex = state.recentFiles.indexOf(tab.filePath);
            if (recentIndex > -1) {
              state.recentFiles.splice(recentIndex, 1);
            }
            state.recentFiles.unshift(tab.filePath);
            state.recentFiles = state.recentFiles.slice(0, 10); // 保留最近10个文件
          }
        });
      },

      switchTab: (tabId, paneId) => {
        set((state) => {
          const targetPaneId = paneId || state.activePane;
          const pane = state.panes[targetPaneId];
          
          if (pane && pane.tabs.includes(tabId)) {
            pane.activeTab = tabId;
            state.activePane = targetPaneId;
          }
        });
      },

      updateTab: (tabId, updates) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (tab) {
            Object.assign(tab, updates);
            tab.modifiedAt = new Date();
            
            // 如果内容发生变化，标记为脏数据并触发自动保存
            if ('content' in updates) {
              tab.isDirty = true;
              
              // 触发自动保存
              if (state.settings.autoSave) {
                autoSaveService.triggerAutoSave(tab, state.settings);
              }
            }
          }
        });
      },

      moveTab: (tabId, fromPane, toPane, index) => {
        set((state) => {
          const fromPaneObj = state.panes[fromPane];
          const toPaneObj = state.panes[toPane];
          
          if (!fromPaneObj || !toPaneObj) return;
          
          // 如果是同一个面板内的重排序
          if (fromPane === toPane) {
            const currentIndex = fromPaneObj.tabs.indexOf(tabId);
            if (currentIndex === -1) return;
            
            const targetIndex = index !== undefined ? index : fromPaneObj.tabs.length - 1;
            
            // 如果位置没有变化，直接返回
            if (currentIndex === targetIndex) return;
            
            // 移除标签页
            const [movedTab] = fromPaneObj.tabs.splice(currentIndex, 1);
            
            // 计算新的插入位置（考虑移除后的索引变化）
            const newIndex = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
            
            // 插入到新位置
            fromPaneObj.tabs.splice(newIndex, 0, movedTab);
          } else {
            // 跨面板移动
            // 从源面板移除
            const tabIndex = fromPaneObj.tabs.indexOf(tabId);
            if (tabIndex > -1) {
              fromPaneObj.tabs.splice(tabIndex, 1);
              
              // 如果移除的是活动标签页，更新活动标签页
              if (fromPaneObj.activeTab === tabId) {
                fromPaneObj.activeTab = fromPaneObj.tabs[0] || '';
              }
            }
            
            // 添加到目标面板
            const insertIndex = index !== undefined ? index : toPaneObj.tabs.length;
            toPaneObj.tabs.splice(insertIndex, 0, tabId);
            toPaneObj.activeTab = tabId;
            
            // 激活目标面板
            state.activePane = toPane;
          }
        });
      },

      duplicateTab: (tabId) => {
        const tab = get().tabs[tabId];
        if (!tab) return '';
        
        const newTabId = get().createTab({
          title: `${tab.title} (副本)`,
          content: tab.content,
          type: tab.type,
          language: tab.language
        });
        
        return newTabId;
      },

      lockTab: (tabId, locked) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (tab) {
            tab.isLocked = locked;
          }
        });
      },

      reorderTab: (tabId, paneId, newIndex) => {
        set((state) => {
          const pane = state.panes[paneId];
          if (!pane) return;
          
          const currentIndex = pane.tabs.indexOf(tabId);
          if (currentIndex === -1 || currentIndex === newIndex) return;
          
          // 移除标签页
          const [movedTab] = pane.tabs.splice(currentIndex, 1);
          
          // 计算实际插入位置
          const insertIndex = newIndex > currentIndex ? newIndex - 1 : newIndex;
          
          // 插入到新位置
          pane.tabs.splice(insertIndex, 0, movedTab);
        });
      },

      // Pane 操作
      createPane: (options = {}) => {
        const paneId = generateId();
        const pane = createDefaultPane({ id: paneId, ...options });
        
        set((state) => {
          state.panes[paneId] = pane;
          state.layout.panes.push(pane);
          
          if (!state.activePane) {
            state.activePane = paneId;
          }
        });
        
        return paneId;
      },

      closePane: (paneId) => {
        set((state) => {
          const pane = state.panes[paneId];
          if (!pane) return;
          
          // 如果面板有标签页，尝试将它们移动到相邻面板
          if (pane.tabs.length > 0) {
            // 找到相邻的面板
            const adjacentSplitter = state.layout.splitters.find(
              s => s.paneA === paneId || s.paneB === paneId
            );
            
            if (adjacentSplitter) {
              const targetPaneId = adjacentSplitter.paneA === paneId 
                ? adjacentSplitter.paneB 
                : adjacentSplitter.paneA;
              
              const targetPane = state.panes[targetPaneId];
              if (targetPane) {
                // 移动所有标签页到目标面板
                pane.tabs.forEach(tabId => {
                  if (!targetPane.tabs.includes(tabId)) {
                    targetPane.tabs.push(tabId);
                  }
                });
                
                // 如果当前面板有活动标签页，将其设为目标面板的活动标签页
                if (pane.activeTab && state.tabs[pane.activeTab]) {
                  targetPane.activeTab = pane.activeTab;
                }
              }
            } else {
              // 没有相邻面板，删除所有标签页
              pane.tabs.forEach(tabId => {
                delete state.tabs[tabId];
              });
            }
          }
          
          // 删除面板
          delete state.panes[paneId];
          state.layout.panes = state.layout.panes.filter(p => p.id !== paneId);
          
          // 如果关闭的是活动面板，切换到其他面板
          if (state.activePane === paneId) {
            const remainingPanes = Object.keys(state.panes);
            state.activePane = remainingPanes[0] || '';
          }
          
          // 清理相关的分割器
          state.layout.splitters = state.layout.splitters.filter(
            s => s.paneA !== paneId && s.paneB !== paneId
          );
          
          // 如果没有分割器了，切换到单面板模式
          if (state.layout.splitters.length === 0) {
            state.layout.type = 'single';
          }
        });
      },

      activatePane: (paneId) => {
        set((state) => {
          if (state.panes[paneId]) {
            state.activePane = paneId;
          }
        });
      },

      splitPane: (paneId, direction) => {
        const newPaneId = generateId();
        const newPane = createDefaultPane({ id: newPaneId });
        
        set((state) => {
          state.panes[newPaneId] = newPane;
          state.layout.panes.push(newPane);
          
          // 创建分割器
          const splitterId = generateId();
          const splitter: PaneSplitter = {
            id: splitterId,
            direction,
            position: 0.5,
            paneA: paneId,
            paneB: newPaneId
          };
          
          state.layout.splitters.push(splitter);
          state.layout.type = 'split';
          state.activePane = newPaneId;
        });
        
        return newPaneId;
      },

      // 分屏并移动标签页
      splitPaneWithTab: (tabId, direction) => {
        const state = get();
        const tab = state.tabs[tabId];
        if (!tab) return '';

        // 找到包含此标签页的面板
        const currentPaneId = Object.keys(state.panes).find(id => 
          state.panes[id].tabs.includes(tabId)
        );
        
        if (!currentPaneId) return '';

        // 创建新面板
        const newPaneId = get().splitPane(currentPaneId, direction);
        
        // 移动标签页到新面板
        get().moveTab(tabId, currentPaneId, newPaneId);
        
        return newPaneId;
      },

      resizePane: (paneId, width, height) => {
        set((state) => {
          const pane = state.panes[paneId];
          if (pane) {
            const minSize = get().getPaneMinSize();
            pane.position.width = Math.max(minSize.width, width);
            pane.position.height = Math.max(minSize.height, height);
          }
        });
      },

      mergePanes: (paneAId, paneBId) => {
        set((state) => {
          const paneA = state.panes[paneAId];
          const paneB = state.panes[paneBId];
          
          if (!paneA || !paneB) return;
          
          // 将 paneB 的所有标签页移动到 paneA
          paneB.tabs.forEach(tabId => {
            if (!paneA.tabs.includes(tabId)) {
              paneA.tabs.push(tabId);
            }
          });
          
          // 如果 paneB 有活动标签页，将其设为 paneA 的活动标签页
          if (paneB.activeTab && state.tabs[paneB.activeTab]) {
            paneA.activeTab = paneB.activeTab;
          }
          
          // 删除 paneB
          delete state.panes[paneBId];
          state.layout.panes = state.layout.panes.filter(p => p.id !== paneBId);
          
          // 移除相关的分割器
          state.layout.splitters = state.layout.splitters.filter(
            s => s.paneA !== paneBId && s.paneB !== paneBId
          );
          
          // 如果删除的是活动面板，切换到合并后的面板
          if (state.activePane === paneBId) {
            state.activePane = paneAId;
          }
          
          // 如果没有分割器了，切换到单面板模式
          if (state.layout.splitters.length === 0) {
            state.layout.type = 'single';
          }
        });
      },

      canMergePanes: (paneAId, paneBId) => {
        const state = get();
        const paneA = state.panes[paneAId];
        const paneB = state.panes[paneBId];
        
        if (!paneA || !paneB) return false;
        
        // 检查是否有分割器连接这两个面板
        const hasDirectSplitter = state.layout.splitters.some(
          s => (s.paneA === paneAId && s.paneB === paneBId) ||
               (s.paneA === paneBId && s.paneB === paneAId)
        );
        
        return hasDirectSplitter;
      },

      getPaneMinSize: () => {
        return { width: 200, height: 150 };
      },

      validatePaneSize: (paneId, width, height) => {
        const minSize = get().getPaneMinSize();
        return width >= minSize.width && height >= minSize.height;
      },

      autoMergePanes: () => {
        set((state) => {
          const minSize = get().getPaneMinSize();
          const panesToMerge: Array<{ small: string; target: string }> = [];
          
          // 检查所有面板的大小
          Object.values(state.panes).forEach(pane => {
            if (pane.position.width < minSize.width || pane.position.height < minSize.height) {
              // 找到相邻的面板进行合并
              const adjacentSplitter = state.layout.splitters.find(
                s => s.paneA === pane.id || s.paneB === pane.id
              );
              
              if (adjacentSplitter) {
                const targetPaneId = adjacentSplitter.paneA === pane.id 
                  ? adjacentSplitter.paneB 
                  : adjacentSplitter.paneA;
                
                panesToMerge.push({ small: pane.id, target: targetPaneId });
              }
            }
          });
          
          // 执行合并
          panesToMerge.forEach(({ small, target }) => {
            get().mergePanes(target, small);
          });
        });
      },

      // 布局操作
      createSplit: (paneAId, paneBId, direction) => {
        const splitterId = generateId();
        
        set((state) => {
          const splitter: PaneSplitter = {
            id: splitterId,
            direction,
            position: 0.5,
            paneA: paneAId,
            paneB: paneBId
          };
          
          state.layout.splitters.push(splitter);
          state.layout.type = 'split';
        });
        
        return splitterId;
      },

      removeSplit: (splitterId) => {
        set((state) => {
          state.layout.splitters = state.layout.splitters.filter(s => s.id !== splitterId);
          
          if (state.layout.splitters.length === 0) {
            state.layout.type = 'single';
          }
        });
      },

      resizeSplit: (splitterId, position) => {
        set((state) => {
          const splitter = state.layout.splitters.find(s => s.id === splitterId);
          if (!splitter) return;
          
          const minSize = get().getPaneMinSize();
          const minRatio = 0.15; // 最小比例 15%
          const maxRatio = 0.85; // 最大比例 85%
          
          // 限制分割位置在合理范围内
          const newPosition = Math.max(minRatio, Math.min(maxRatio, position));
          
          // 检查分割后的面板是否满足最小尺寸要求
          const paneA = state.panes[splitter.paneA];
          const paneB = state.panes[splitter.paneB];
          
          if (paneA && paneB) {
            // 计算分割后的尺寸（这里简化处理，实际应该根据容器尺寸计算）
            const isHorizontal = splitter.direction === 'horizontal';
            const containerSize = isHorizontal ? 600 : 800; // 假设的容器尺寸
            
            const sizeA = containerSize * newPosition;
            const sizeB = containerSize * (1 - newPosition);
            
            const minSizeValue = isHorizontal ? minSize.height : minSize.width;
            
            // 如果任一面板小于最小尺寸，触发自动合并
            if (sizeA < minSizeValue || sizeB < minSizeValue) {
              // 合并到较大的面板
              const targetPane = sizeA > sizeB ? splitter.paneA : splitter.paneB;
              const sourcePane = sizeA > sizeB ? splitter.paneB : splitter.paneA;
              
              get().mergePanes(targetPane, sourcePane);
              return;
            }
          }
          
          splitter.position = newPosition;
        });
      },

      // 拖拽操作
      startDrag: (tabId, fromPane) => {
        set((state) => {
          state.dragState = {
            draggedTab: tabId,
            draggedFrom: fromPane
          };
        });
      },

      updateDrag: (dragOverPane, position) => {
        set((state) => {
          if (state.dragState) {
            state.dragState.dragOverPane = dragOverPane;
            state.dragState.dragPosition = position;
          }
        });
      },

      endDrag: () => {
        set((state) => {
          state.dragState = undefined;
        });
      },

      // 文件操作
      openFile: (filePath, content = '') => {
        // 检查文件是否已经打开
        const existingTab = Object.values(get().tabs).find(tab => tab.filePath === filePath);
        if (existingTab) {
          get().switchTab(existingTab.id);
          return existingTab.id;
        }
        
        // 创建新标签页
        const fileName = filePath.split('/').pop() || 'Untitled';
        const tabId = get().createTab({
          title: fileName,
          filePath,
          content,
          type: 'file'
        });
        
        return tabId;
      },

      saveFile: async (tabId) => {
        const tab = get().tabs[tabId];
        if (!tab || !tab.filePath) return;
        
        try {
          // 立即保存到自动保存系统
          await autoSaveService.saveImmediately(tab);
          
          // 这里应该调用实际的文件保存 API
          // await fileSystem.writeFile(tab.filePath, tab.content);
          
          set((state) => {
            const currentTab = state.tabs[tabId];
            if (currentTab) {
              currentTab.isDirty = false;
              currentTab.modifiedAt = new Date();
            }
          });
        } catch (error) {
          console.error('Failed to save file:', error);
          throw error;
        }
      },

      saveAllFiles: async () => {
        const state = get();
        const result = await autoSaveService.saveAll(state.tabs);
        
        // 更新成功保存的标签页状态
        set((state) => {
          result.saved.forEach(tabId => {
            const tab = state.tabs[tabId];
            if (tab) {
              tab.isDirty = false;
              tab.modifiedAt = new Date();
            }
          });
        });
        
        // 如果有失败的保存，记录错误
        if (result.failed.length > 0) {
          console.error(`Failed to save ${result.failed.length} files:`, result.failed);
        }
        
        return result;
      },

      // 设置操作
      updateSettings: (settings) => {
        set((state) => {
          Object.assign(state.settings, settings);
        });
      },

      // 持久化操作
      saveSession: async () => {
        try {
          const state = get();
          await storageManager.saveSession(state);
        } catch (error) {
          console.error('Failed to save session:', error);
          throw error;
        }
      },

      loadSession: async () => {
        try {
          const sessionState = await storageManager.loadSession();
          if (sessionState) {
            set((state) => {
              if (sessionState.tabs) state.tabs = sessionState.tabs;
              if (sessionState.panes) state.panes = sessionState.panes;
              if (sessionState.tabGroups) state.tabGroups = sessionState.tabGroups;
              if (sessionState.layout) state.layout = sessionState.layout;
              if (sessionState.activePane) state.activePane = sessionState.activePane;
              if (sessionState.recentFiles) state.recentFiles = sessionState.recentFiles;
              if (sessionState.settings) state.settings = { ...state.settings, ...sessionState.settings };
            });
          }
        } catch (error) {
          console.error('Failed to load session:', error);
          throw error;
        }
      },

      clearSession: async () => {
        try {
          await storageManager.clearSession();
          
          // 重置为初始状态
          set((state) => {
            Object.assign(state, initialState);
          });
        } catch (error) {
          console.error('Failed to clear session:', error);
          throw error;
        }
      },

      recoverSession: async () => {
        try {
          const recoveryResult = await sessionRecoveryService.recoverSession();
          
          if (recoveryResult.state) {
            set((state) => {
              if (recoveryResult.state.tabs) state.tabs = recoveryResult.state.tabs;
              if (recoveryResult.state.panes) state.panes = recoveryResult.state.panes;
              if (recoveryResult.state.tabGroups) state.tabGroups = recoveryResult.state.tabGroups;
              if (recoveryResult.state.layout) state.layout = recoveryResult.state.layout;
              if (recoveryResult.state.activePane) state.activePane = recoveryResult.state.activePane;
              if (recoveryResult.state.recentFiles) state.recentFiles = recoveryResult.state.recentFiles;
              if (recoveryResult.state.settings) state.settings = { ...state.settings, ...recoveryResult.state.settings };
            });
          }
          
          return {
            recovered: recoveryResult.recovered,
            errors: recoveryResult.errors,
            warnings: recoveryResult.warnings
          };
        } catch (error) {
          console.error('Failed to recover session:', error);
          return {
            recovered: false,
            errors: [error instanceof StateError ? error : new StateError('corruption', 'Session recovery failed', false)],
            warnings: []
          };
        }
      },

      // 自动保存操作
      enableAutoSave: () => {
        autoSaveService.enable();
        set((state) => {
          state.settings.autoSave = true;
        });
      },

      disableAutoSave: () => {
        autoSaveService.disable();
        set((state) => {
          state.settings.autoSave = false;
        });
      },

      triggerAutoSave: (tabId) => {
        const state = get();
        const tab = state.tabs[tabId];
        if (tab) {
          autoSaveService.triggerAutoSave(tab, state.settings);
        }
      },

      saveImmediately: async (tabId) => {
        const state = get();
        const tab = state.tabs[tabId];
        if (tab) {
          const success = await autoSaveService.saveImmediately(tab);
          if (success) {
            set((state) => {
              const currentTab = state.tabs[tabId];
              if (currentTab) {
                currentTab.isDirty = false;
                currentTab.modifiedAt = new Date();
              }
            });
          }
          return success;
        }
        return false;
      },

      recoverAutoSavedContent: async (tabId) => {
        return await autoSaveService.recoverAutoSavedContent(tabId);
      },

      // 工具方法
      getActiveTab: () => {
        const state = get();
        const activePane = state.panes[state.activePane];
        if (activePane && activePane.activeTab) {
          return state.tabs[activePane.activeTab];
        }
        return undefined;
      },

      getActivePane: () => {
        const state = get();
        return state.panes[state.activePane];
      },

      getTabsByPane: (paneId) => {
        const state = get();
        const pane = state.panes[paneId];
        if (!pane) return [];
        
        return pane.tabs.map(tabId => state.tabs[tabId]).filter(Boolean);
      },

      getPaneById: (paneId) => {
        return get().panes[paneId];
      },

      getTabById: (tabId) => {
        return get().tabs[tabId];
      },

      // Tab Groups 操作
      createTabGroup: (name, color, tabIds = []) => {
        const groupId = generateId();
        const group: TabGroup = {
          id: groupId,
          name,
          color,
          tabs: [...tabIds],
          createdAt: new Date()
        };
        
        set((state) => {
          state.tabGroups[groupId] = group;
          
          // 将标签页添加到组中
          tabIds.forEach(tabId => {
            const tab = state.tabs[tabId];
            if (tab) {
              tab.groupId = groupId;
              tab.color = color;
            }
          });
        });
        
        return groupId;
      },

      deleteTabGroup: (groupId) => {
        set((state) => {
          const group = state.tabGroups[groupId];
          if (!group) return;
          
          // 从组中移除所有标签页
          group.tabs.forEach(tabId => {
            const tab = state.tabs[tabId];
            if (tab) {
              delete tab.groupId;
              delete tab.color;
            }
          });
          
          delete state.tabGroups[groupId];
        });
      },

      addTabToGroup: (tabId, groupId) => {
        set((state) => {
          const tab = state.tabs[tabId];
          const group = state.tabGroups[groupId];
          
          if (!tab || !group) return;
          
          // 如果标签页已经在其他组中，先移除
          if (tab.groupId && tab.groupId !== groupId) {
            const oldGroup = state.tabGroups[tab.groupId];
            if (oldGroup) {
              oldGroup.tabs = oldGroup.tabs.filter(id => id !== tabId);
            }
          }
          
          // 添加到新组
          tab.groupId = groupId;
          tab.color = group.color;
          
          if (!group.tabs.includes(tabId)) {
            group.tabs.push(tabId);
          }
        });
      },

      removeTabFromGroup: (tabId) => {
        set((state) => {
          const tab = state.tabs[tabId];
          if (!tab || !tab.groupId) return;
          
          const group = state.tabGroups[tab.groupId];
          if (group) {
            group.tabs = group.tabs.filter(id => id !== tabId);
          }
          
          delete tab.groupId;
          delete tab.color;
        });
      },

      updateTabGroup: (groupId, updates) => {
        set((state) => {
          const group = state.tabGroups[groupId];
          if (!group) return;
          
          Object.assign(group, updates);
          
          // 如果颜色改变了，更新组内所有标签页的颜色
          if (updates.color) {
            group.tabs.forEach(tabId => {
              const tab = state.tabs[tabId];
              if (tab) {
                tab.color = updates.color;
              }
            });
          }
        });
      },

      // Related Tabs 操作
      linkTabs: (tabId1, tabId2) => {
        set((state) => {
          const tab1 = state.tabs[tabId1];
          const tab2 = state.tabs[tabId2];
          
          if (!tab1 || !tab2) return;
          
          // 初始化关联标签页数组
          if (!tab1.relatedTabs) tab1.relatedTabs = [];
          if (!tab2.relatedTabs) tab2.relatedTabs = [];
          
          // 双向关联
          if (!tab1.relatedTabs.includes(tabId2)) {
            tab1.relatedTabs.push(tabId2);
          }
          if (!tab2.relatedTabs.includes(tabId1)) {
            tab2.relatedTabs.push(tabId1);
          }
        });
      },

      unlinkTabs: (tabId1, tabId2) => {
        set((state) => {
          const tab1 = state.tabs[tabId1];
          const tab2 = state.tabs[tabId2];
          
          if (!tab1 || !tab2) return;
          
          // 移除双向关联
          if (tab1.relatedTabs) {
            tab1.relatedTabs = tab1.relatedTabs.filter(id => id !== tabId2);
          }
          if (tab2.relatedTabs) {
            tab2.relatedTabs = tab2.relatedTabs.filter(id => id !== tabId1);
          }
        });
      },

      getRelatedTabs: (tabId) => {
        const state = get();
        const tab = state.tabs[tabId];
        
        if (!tab || !tab.relatedTabs) return [];
        
        return tab.relatedTabs
          .map(id => state.tabs[id])
          .filter(Boolean);
      },

      findRelatedFiles: (filePath) => {
        const state = get();
        const relatedFiles: string[] = [];
        
        if (!filePath) return relatedFiles;
        
        const fileName = filePath.split('/').pop()?.split('.')[0];
        const fileExt = filePath.split('.').pop();
        const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
        
        // 查找相关文件的策略
        Object.values(state.tabs).forEach(tab => {
          if (!tab.filePath || tab.filePath === filePath) return;
          
          const tabFileName = tab.filePath.split('/').pop()?.split('.')[0];
          const tabFileExt = tab.filePath.split('.').pop();
          const tabDirPath = tab.filePath.substring(0, tab.filePath.lastIndexOf('/'));
          
          // 同名不同扩展名的文件
          if (fileName && tabFileName === fileName && tabFileExt !== fileExt) {
            relatedFiles.push(tab.filePath);
          }
          // 同目录下的测试文件
          else if (dirPath === tabDirPath && (
            (fileName && tabFileName?.includes(fileName) && tabFileName.includes('test')) ||
            (fileName && tabFileName?.includes(fileName) && tabFileName.includes('spec')) ||
            (tabFileName && fileName?.includes(tabFileName) && fileName.includes('test')) ||
            (tabFileName && fileName?.includes(tabFileName) && fileName.includes('spec'))
          )) {
            relatedFiles.push(tab.filePath);
          }
          // 相似命名的文件
          else if (fileName && tabFileName && (
            fileName.includes(tabFileName) || tabFileName.includes(fileName)
          ) && Math.abs(fileName.length - tabFileName.length) <= 3) {
            relatedFiles.push(tab.filePath);
          }
        });
        
        return relatedFiles;
      },

      // Advanced Tab 操作
      moveTabToNewWindow: (tabId) => {
        const state = get();
        const tab = state.tabs[tabId];
        
        if (!tab) return;
        
        // 在实际应用中，这里会打开新窗口
        // 目前只是模拟功能，显示通知
        if (typeof window !== 'undefined') {
          // 尝试打开新窗口
          const newWindow = window.open('', '_blank', 'width=800,height=600');
          
          if (newWindow) {
            // 在新窗口中显示标签页内容
            newWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${tab.title}</title>
                  <style>
                    body { font-family: monospace; padding: 20px; }
                    pre { white-space: pre-wrap; }
                  </style>
                </head>
                <body>
                  <h1>${tab.title}</h1>
                  <pre>${tab.content}</pre>
                </body>
              </html>
            `);
            newWindow.document.close();
            
            // 从当前窗口关闭标签页
            get().closeTab(tabId);
          } else {
            // 如果无法打开新窗口，显示提示
            alert('无法打开新窗口，请检查浏览器设置');
          }
        }
      },

      getTabGroupById: (groupId) => {
        return get().tabGroups[groupId];
      },

      getTabsByGroup: (groupId) => {
        const state = get();
        const group = state.tabGroups[groupId];
        
        if (!group) return [];
        
        return group.tabs
          .map(tabId => state.tabs[tabId])
          .filter(Boolean);
      }
    }))
  )
);

// 自动保存会话和初始化
if (typeof window !== 'undefined') {
  let saveTimeout: NodeJS.Timeout;
  
  // 订阅状态变化进行自动保存
  useObsidianEditorStore.subscribe(
    (state) => ({ tabs: state.tabs, panes: state.panes, tabGroups: state.tabGroups, layout: state.layout, settings: state.settings }),
    (current, previous) => {
      // 清除之前的定时器
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // 延迟保存，避免频繁写入
      saveTimeout = setTimeout(async () => {
        try {
          const saveSession = useObsidianEditorStore.getState().saveSession;
          await saveSession();
        } catch (error) {
          console.error('Auto-save session failed:', error);
        }
      }, 2000);
    }
  );

  // 页面加载时尝试恢复会话
  window.addEventListener('load', async () => {
    try {
      const recoverSession = useObsidianEditorStore.getState().recoverSession;
      const result = await recoverSession();
      
      if (result.warnings.length > 0) {
        console.warn('Session recovery warnings:', result.warnings);
      }
      
      if (result.errors.length > 0) {
        console.error('Session recovery errors:', result.errors);
      }
      
      if (result.recovered) {
        console.log('Session recovered successfully');
      } else {
        console.log('Started with default session');
      }
    } catch (error) {
      console.error('Failed to recover session on load:', error);
    }
  });

  // 页面卸载时保存会话
  window.addEventListener('beforeunload', async (event) => {
    try {
      const state = useObsidianEditorStore.getState();
      
      // 检查是否有未保存的更改
      const hasUnsavedChanges = Object.values(state.tabs).some(tab => tab.isDirty);
      
      if (hasUnsavedChanges) {
        // 尝试快速保存
        await state.saveAllFiles();
        
        // 显示确认对话框
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
      
      // 保存会话
      await state.saveSession();
    } catch (error) {
      console.error('Failed to save on page unload:', error);
    }
  });

  // 页面失去焦点时保存
  window.addEventListener('blur', async () => {
    try {
      const state = useObsidianEditorStore.getState();
      if (state.settings.autoSave) {
        await state.saveAllFiles();
      }
    } catch (error) {
      console.error('Failed to save on blur:', error);
    }
  });

  // 定期清理过期的自动保存数据
  setInterval(async () => {
    try {
      await autoSaveService.cleanupExpiredAutoSaves();
    } catch (error) {
      console.error('Failed to cleanup expired auto-saves:', error);
    }
  }, 60 * 60 * 1000); // 每小时清理一次
}