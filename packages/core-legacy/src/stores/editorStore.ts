/**
 * @deprecated This store is deprecated. Use EditorService from @lgnixai/luckin-core instead
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getGlobalApp, type EditorService, type IEditorDocument, type IEditorTab, type IEditorGroup } from '@lgnixai/luckin-core';
import type { PanelNode, TabType } from '../types';
import {
  findFirstLeaf,
  addTabToPanelImmutable,
  activateTabInPanelImmutable,
  splitPanelImmutable,
  closeTabInPanelImmutable,
} from '../utils/panelTree';

console.warn('editorStore is deprecated. Use EditorService from @lgnixai/luckin-core instead.');

export interface EditorTab {
  id: string;
  name: string;
  path?: string;
  content: string;
  language: string;
  isDirty: boolean;
  isReadOnly: boolean;
  isActive: boolean;
}

export interface EditorGroup {
  id: string;
  tabs: EditorTab[];
  activeTabId?: string;
}

export interface EditorState {
  groups: EditorGroup[];
  currentGroupId?: string;
  isFullscreen: boolean;
  loading: boolean;
  // Obsidian-style panel tree state
  panelTree?: PanelNode;
}

interface EditorServiceState extends EditorState {
  // Actions - bridge to new service
  createEditor: (name: string, content?: string, language?: string) => string;
  createDiffEditor: (leftFile: string, rightFile: string) => string;
  createCustomEditor: (type: string, data: any) => string;
  openFile: (path: string, content: string, language?: string) => string;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  setTabReadOnly: (tabId: string, readOnly: boolean) => void;
  toggleLoading: () => void;
  updateWelcomePage: () => void;
  toggleDirection: () => void;
  addExecuteAction: (action: any) => void;
  updateExecuteAction: (actionId: string, action: any) => void;
  setActiveGroup: (groupId: string) => void;
  createNewGroup: () => string;
  moveTabToGroup: (tabId: string, targetGroupId: string) => void;
  // Obsidian-style panel APIs
  initializePanelTree: (tree?: PanelNode) => void;
  splitPanel: (panelId: string, direction: 'horizontal' | 'vertical') => void;
  addTabToPanel: (panelId: string, tab: TabType) => void;
  closeTabInPanel: (panelId: string, tabId: string) => void;
  activateTabInPanel: (panelId: string, tabId: string) => void;
}

// Get editor service instance
function getEditorService(): EditorService {
  try {
    return getGlobalApp().getService<EditorService>('editor');
  } catch {
    // Fallback if app not initialized yet
    return null as any;
  }
}

const defaultContent = `// Welcome to Luckin 3.x Editor
// This is a modern Web IDE built with React and Monaco Editor

import React from 'react';
import { Editor } from '@monaco-editor/react';

function App() {
  const [code, setCode] = React.useState('// Start coding here...');
  
  return (
    <div className="editor-container">
      <Editor
        height="100%"
        language="typescript"
        value={code}
        onChange={(value) => setCode(value || '')}
        theme="vs-dark"
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          lineNumbers: 'on',
          wordWrap: 'on'
        }}
      />
    </div>
  );
}

export default App;`;

const welcomeContent = `# Welcome to Luckin 3.x

## 🚀 Modern Web IDE Framework

Luckin 3.x is a completely rewritten version of the Luckin IDE framework, built with modern technologies:

### ✨ Key Features
- **Modern UI**: Built with shadcn/ui and Tailwind CSS
- **Monaco Editor**: Full-featured code editor
- **TypeScript**: Complete type safety
- **Extensible**: Plugin architecture
- **Responsive**: Works on all screen sizes

### 🛠️ Technology Stack
- React 18
- TypeScript 5.x
- Vite
- Zustand
- Monaco Editor
- Tailwind CSS

### 📚 Getting Started
1. Open a file using the file explorer
2. Start coding with syntax highlighting
3. Use the integrated terminal
4. Install extensions for more features

Happy coding! 🎉`;

export const useEditorService = create<EditorServiceState>()(
  immer((set, get) => ({
    groups: [
      {
        id: 'main-group',
        tabs: [
          {
            id: 'welcome-tab',
            name: 'Welcome',
            content: welcomeContent,
            language: 'markdown',
            isDirty: false,
            isReadOnly: true,
            isActive: true
          }
        ],
        activeTabId: 'welcome-tab'
      }
    ],
    currentGroupId: 'main-group',
    isFullscreen: false,
    loading: false,
    panelTree: {
      id: 'root',
      type: 'split',
      direction: 'horizontal',
      children: [
        {
          id: 'left',
          type: 'leaf',
          tabs: [
            { id: '1', title: '新标签页', isActive: true },
          ],
          size: 35,
          minSize: 20,
        },
      ],
    },

    createEditor: (name, content = '', language = 'typescript') => {
      console.warn('createEditor is deprecated. Use EditorService.createDocument instead.');
      const editorService = getEditorService();
      if (editorService) {
        const doc = editorService.createDocument(`untitled:${name}`, content || defaultContent, language);
        editorService.openTab(doc.id);
        return doc.id;
      }
      
      // Fallback to legacy implementation
      const tabId = `editor-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name,
            content: content || defaultContent,
            language,
            isDirty: false,
            isReadOnly: false,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });

      return tabId;
    },

    createDiffEditor: (leftFile, rightFile) => {
      console.warn('createDiffEditor is deprecated. Use EditorService instead.');
      const tabId = `diff-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name: `Diff: ${leftFile} ↔ ${rightFile}`,
            content: `// Diff Editor\n// Left: ${leftFile}\n// Right: ${rightFile}\n\n// Differences will be highlighted here`,
            language: 'typescript',
            isDirty: false,
            isReadOnly: true,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });

      return tabId;
    },

    createCustomEditor: (type, data) => {
      console.warn('createCustomEditor is deprecated. Use EditorService instead.');
      const tabId = `custom-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name: `Custom: ${type}`,
            content: `// Custom Editor: ${type}\n// Data: ${JSON.stringify(data, null, 2)}`,
            language: 'json',
            isDirty: false,
            isReadOnly: false,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });

      return tabId;
    },

    openFile: (path, content, language = 'typescript') => {
      console.warn('openFile is deprecated. Use EditorService.createDocument instead.');
      const editorService = getEditorService();
      if (editorService) {
        const doc = editorService.createDocument(path, content, language);
        editorService.openTab(doc.id);
        return doc.id;
      }
      
      // Fallback to legacy implementation
      const tabId = `file-${Date.now()}`;
      const groupId = get().currentGroupId || 'main-group';
      const fileName = path.split('/').pop() || 'untitled';
      
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.tabs.forEach(tab => tab.isActive = false);
          
          const newTab: EditorTab = {
            id: tabId,
            name: fileName,
            path,
            content,
            language,
            isDirty: false,
            isReadOnly: false,
            isActive: true
          };
          
          group.tabs.push(newTab);
          group.activeTabId = tabId;
        }
      });

      return tabId;
    },

    closeTab: (tabId) => {
      console.warn('closeTab is deprecated. Use EditorService.closeTab instead.');
      const editorService = getEditorService();
      if (editorService) {
        editorService.closeTab(tabId);
        return;
      }

      set((state) => {
        state.groups.forEach(group => {
          const tabIndex = group.tabs.findIndex(tab => tab.id === tabId);
          if (tabIndex !== -1) {
            const wasActive = group.tabs[tabIndex].isActive;
            group.tabs.splice(tabIndex, 1);
            
            if (wasActive && group.tabs.length > 0) {
              const newActiveTab = group.tabs[group.tabs.length - 1];
              newActiveTab.isActive = true;
              group.activeTabId = newActiveTab.id;
            } else if (group.tabs.length === 0) {
              group.activeTabId = undefined;
            }
          }
        });
      });
    },

    switchTab: (tabId) => {
      console.warn('switchTab is deprecated. Use EditorService.activateTab instead.');
      const editorService = getEditorService();
      if (editorService) {
        editorService.activateTab(tabId);
        return;
      }

      set((state) => {
        state.groups.forEach(group => {
          group.tabs.forEach(tab => {
            tab.isActive = tab.id === tabId;
            if (tab.isActive) {
              group.activeTabId = tabId;
            }
          });
        });
      });
    },

    updateTabContent: (tabId, content) => {
      console.warn('updateTabContent is deprecated. Use EditorService.updateDocument instead.');
      const editorService = getEditorService();
      if (editorService) {
        editorService.updateDocument(tabId, content);
        return;
      }

      set((state) => {
        state.groups.forEach(group => {
          const tab = group.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.content = content;
            tab.isDirty = true;
          }
        });
      });
    },

    setTabReadOnly: (tabId, readOnly) => {
      set((state) => {
        state.groups.forEach(group => {
          const tab = group.tabs.find(t => t.id === tabId);
          if (tab) {
            tab.isReadOnly = readOnly;
          }
        });
      });
    },

    toggleLoading: () => {
      set((state) => {
        state.loading = !state.loading;
      });
    },

    updateWelcomePage: () => {
      set((state) => {
        const welcomeTab = state.groups
          .flatMap(g => g.tabs)
          .find(tab => tab.id === 'welcome-tab');
        
        if (welcomeTab) {
          welcomeTab.content = `# Welcome to Luckin 3.x - Updated!

## 🎉 Latest Updates
- **Version**: 3.0.0
- **New Features**: 3
- **Bug Fixes**: 12
- **Updated**: ${new Date().toLocaleString()}

## 🚀 What's New
1. **Enhanced Editor**: Better syntax highlighting
2. **Improved Performance**: 3x faster loading
3. **New Extensions**: More plugins available

## 🛠️ Quick Actions
- Press \`Ctrl+N\` to create a new file
- Press \`Ctrl+O\` to open a file
- Press \`Ctrl+S\` to save
- Press \`F11\` for fullscreen

Happy coding! 🎉`;
        }
      });
    },

    toggleDirection: () => {
      set((state) => {
        state.isFullscreen = !state.isFullscreen;
      });
    },

    addExecuteAction: (action) => {
      console.log('Execute action added:', action);
    },

    updateExecuteAction: (actionId, action) => {
      console.log('Execute action updated:', actionId, action);
    },

    setActiveGroup: (groupId) => {
      set((state) => {
        state.currentGroupId = groupId;
        state.groups.forEach(group => {
          group.tabs.forEach(tab => {
            tab.isActive = group.id === groupId && tab.id === group.activeTabId;
          });
        });
      });
    },

    createNewGroup: () => {
      const groupId = `group-${Date.now()}`;
      set((state) => {
        state.groups.push({
          id: groupId,
          tabs: [],
          activeTabId: undefined
        });
        state.currentGroupId = groupId;
      });
      return groupId;
    },

    moveTabToGroup: (tabId, targetGroupId) => {
      set((state) => {
        let sourceTab: EditorTab | undefined;
        let sourceGroupId: string | undefined;
        
        for (const group of state.groups) {
          const tab = group.tabs.find(t => t.id === tabId);
          if (tab) {
            sourceTab = tab;
            sourceGroupId = group.id;
            break;
          }
        }
        
        if (sourceTab && sourceGroupId) {
          const sourceGroup = state.groups.find(g => g.id === sourceGroupId);
          if (sourceGroup) {
            sourceGroup.tabs = sourceGroup.tabs.filter(t => t.id !== tabId);
            if (sourceGroup.activeTabId === tabId) {
              sourceGroup.activeTabId = sourceGroup.tabs.length > 0 ? sourceGroup.tabs[0].id : undefined;
            }
          }
          
          const targetGroup = state.groups.find(g => g.id === targetGroupId);
          if (targetGroup) {
            targetGroup.tabs.push(sourceTab);
            targetGroup.activeTabId = tabId;
          }
        }
      });
    },

    // Obsidian-style panel APIs
    initializePanelTree: (tree) => {
      set((state) => {
        state.panelTree =
          tree || {
            id: 'root',
            type: 'split',
            direction: 'horizontal',
            children: [
              {
                id: 'left',
                type: 'leaf',
                tabs: [{ id: '1', title: '新标签页', isActive: true }],
                size: 35,
                minSize: 20,
              },
            ],
          };
      });
    },

    splitPanel: (panelId, direction) => {
      set((state) => {
        if (!state.panelTree) return;
        
        const findPanel = (node: PanelNode): PanelNode | null => {
          if (node.id === panelId) return node;
          if (node.children) {
            for (const child of node.children) {
              const found = findPanel(child);
              if (found) return found;
            }
          }
          return null;
        };
        
        const target = findPanel(state.panelTree);
        if (target && target.type === 'leaf') {
          const newLeafId = `${panelId}-split-${Date.now()}`;
          const newLeaf: PanelNode = { id: newLeafId, type: 'leaf', tabs: [] };
          target.type = 'split';
          target.direction = direction;
          target.children = [
            { id: `${panelId}-a`, type: 'leaf', tabs: target.tabs || [] },
            newLeaf,
          ];
          delete (target as any).tabs;
        }
      });
    },

    addTabToPanel: (panelId, tab) => {
      set((state) => {
        const visit = (node: PanelNode): boolean => {
          if (node.id === panelId && node.type === 'leaf') {
            node.tabs = node.tabs || [];
            node.tabs.forEach((t) => (t.isActive = false));
            node.tabs.push({ ...tab, isActive: true });
            return true;
          }
          if (node.children) return node.children.some(visit);
          return false;
        };
        if (state.panelTree) visit(state.panelTree);
      });
    },

    closeTabInPanel: (panelId, tabId) => {
      set((state) => {
        const visit = (node: PanelNode): boolean => {
          if (node.id === panelId && node.type === 'leaf' && node.tabs) {
            const idx = node.tabs.findIndex((t) => t.id === tabId);
            if (idx !== -1) {
              const wasActive = !!node.tabs[idx].isActive;
              node.tabs.splice(idx, 1);
              if (wasActive && node.tabs.length > 0) {
                node.tabs[node.tabs.length - 1].isActive = true;
              }
            }
            return true;
          }
          if (node.children) return node.children.some(visit);
          return false;
        };
        if (state.panelTree) visit(state.panelTree);
      });
    },

    activateTabInPanel: (panelId, tabId) => {
      set((state) => {
        const visit = (node: PanelNode): boolean => {
          if (node.id === panelId && node.type === 'leaf' && node.tabs) {
            node.tabs.forEach((t) => (t.isActive = t.id === tabId));
            return true;
          }
          if (node.children) return node.children.some(visit);
          return false;
        };
        if (state.panelTree) visit(state.panelTree);
      });
    },
  }))
);