import React, { useState, useCallback, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { TabBar, type TabType } from './Tab';
import Editor from './Editor';
import WorkspaceManager from './WorkspaceManager';
import { useDocuments } from '@/stores/documents';
import { useTabManager } from '@/stores/tabManager';
import { Layout, Save } from 'lucide-react';
import { useFileTree } from '@/stores/filetree';
import useShortcuts from '@/hooks/useShortcuts';

import type { PanelNode } from '@lginxai/luckin-core-legacy';
import {
  findNodeById as findNodeByIdCore,
  findFirstLeaf as findFirstLeafCore,
  updateTabsForPanel,
  splitPanelImmutable,
  removePanelNodeImmutable,
} from '@lginxai/luckin-core-legacy';

// interface FileNode {
//   id: string;
//   name: string;
//   type: 'file' | 'folder';
//   children?: FileNode[];
// }

const ObsidianLayout: React.FC = () => {
  const { createDocument, renameDocument } = useDocuments();
  const { loadWorkspaceLayout: _loadWorkspaceLayout } = useTabManager();
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  const [panelTree, setPanelTree] = useState<PanelNode>({
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
        minSize: 20
      },
       
    ]
  });

  const { rootId, listChildren, createFile, createFolder, nodesById } = useFileTree();
  const [lastActivePanelId, setLastActivePanelId] = useState<string>('left');

  // Workspace management handlers
  const handleLoadWorkspaceLayout = useCallback((layout: any) => {
    setPanelTree(layout.panelTree);
    setShowWorkspaceManager(false);
  }, []);

  // Global shortcuts
  useShortcuts({
    onSaveWorkspace: () => setShowWorkspaceManager(true),
  });

  // 初始化为每个初始标签创建文档
  useEffect(() => {
    const attachDocs = (node: PanelNode) => {
      if (node.type === 'leaf' && node.tabs) {
        node.tabs = node.tabs.map((t: any) => ({
          ...t,
          documentId: t.documentId ?? createDocument(t.title, { content: '', language: 'markdown' })
        }));
      }
      if (node.children) node.children.forEach(attachDocs);
    };
    setPanelTree(prev => {
      const clone = JSON.parse(JSON.stringify(prev)) as PanelNode;
      attachDocs(clone);
      return clone;
    });
  }, [createDocument]);

  const findPanelById = useCallback((tree: PanelNode, id: string): PanelNode | null => {
    return findNodeByIdCore(tree, id);
  }, []);

  const updatePanelTabs = useCallback((panelId: string, newTabs: TabType[]) => {
    setPanelTree(prevTree => updateTabsForPanel(prevTree, panelId, newTabs as any));
  }, []);

  // 历史栈：记录每个叶子面板的激活序列
  const [historyByPanelId, setHistoryByPanelId] = useState<Record<string, { stack: string[]; index: number }>>({});
  const pushHistory = useCallback((panelId: string, tabId: string) => {
    setHistoryByPanelId(prev => {
      const h = prev[panelId] ?? { stack: [], index: -1 };
      const newStack = h.stack.slice(0, h.index + 1);
      if (newStack[newStack.length - 1] !== tabId) newStack.push(tabId);
      return { ...prev, [panelId]: { stack: newStack, index: newStack.length - 1 } };
    });
  }, []);
  const goBack = useCallback((panelId: string) => {
    setHistoryByPanelId(prev => {
      const h = prev[panelId];
      if (!h || h.index <= 0) return prev;
      const next = { ...prev, [panelId]: { ...h, index: h.index - 1 } };
      const targetTabId = next[panelId].stack[next[panelId].index];
      const panel = findPanelById(panelTree, panelId);
      if (panel?.tabs) {
        const newTabs = panel.tabs.map(t => ({ ...t, isActive: t.id === targetTabId }));
        updatePanelTabs(panelId, newTabs);
      }
      return next;
    });
  }, [findPanelById, panelTree, updatePanelTabs]);
  const goForward = useCallback((panelId: string) => {
    setHistoryByPanelId(prev => {
      const h = prev[panelId];
      if (!h || h.index >= h.stack.length - 1) return prev;
      const next = { ...prev, [panelId]: { ...h, index: h.index + 1 } };
      const targetTabId = next[panelId].stack[next[panelId].index];
      const panel = findPanelById(panelTree, panelId);
      if (panel?.tabs) {
        const newTabs = panel.tabs.map(t => ({ ...t, isActive: t.id === targetTabId }));
        updatePanelTabs(panelId, newTabs);
      }
      return next;
    });
  }, [findPanelById, panelTree, updatePanelTabs]);

  const handleToggleLock = useCallback((panelId: string) => (id: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const newTabs = panel.tabs.map(tab => 
      tab.id === id ? { ...tab, isLocked: !tab.isLocked } : tab
    );
    updatePanelTabs(panelId, newTabs);
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleDuplicate = useCallback((panelId: string) => (id: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      // 如果有documentId，创建新文档副本
      const newDocumentId = targetTab.documentId 
        ? createDocument(`${targetTab.title} - 副本`, { content: '', language: 'markdown' })
        : undefined;
      
      const newTab = {
        ...targetTab,
        id: Date.now().toString(),
        title: `${targetTab.title} - 副本`,
        isActive: false,
        documentId: newDocumentId
      };
      const newTabs = [...panel.tabs, newTab];
      updatePanelTabs(panelId, newTabs);
    }
  }, [panelTree, findPanelById, updatePanelTabs, createDocument]);

  const handleRename = useCallback((panelId: string) => (id: string, newTitle: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const newTabs = panel.tabs.map(tab => {
      if (tab.id === id) {
        if (tab.documentId) renameDocument(tab.documentId, newTitle);
        return { ...tab, title: newTitle };
      }
      return tab;
    });
    updatePanelTabs(panelId, newTabs);
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleCopyPath = useCallback((panelId: string) => (id: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      const pathToCopy = targetTab.filePath || `/${targetTab.title}`;
      navigator.clipboard.writeText(pathToCopy).then(() => {
        // 可以添加一个toast通知
        console.log('路径已复制到剪贴板:', pathToCopy);
      }).catch(err => {
        console.error('复制路径失败:', err);
        // 降级方案：显示路径
        alert(`文件路径: ${pathToCopy}`);
      });
    }
  }, [panelTree, findPanelById]);

  const findFirstLeafPanelId = useCallback((tree: PanelNode): string | null => {
    const leaf = findFirstLeafCore(tree);
    return leaf ? leaf.id : null;
  }, []);

  const openDocumentInTargetPanel = useCallback((docId: string, title: string, filePath?: string) => {
    setPanelTree(prev => {
      const getTargetPanelId = (): string => {
        const p = findPanelById(prev, lastActivePanelId);
        if (p && p.type === 'leaf' && p.tabs) return lastActivePanelId;
        return findFirstLeafPanelId(prev) ?? 'left';
      };
      const targetId = getTargetPanelId();
      const targetPanel = findPanelById(prev, targetId);
      if (!targetPanel || targetPanel.type !== 'leaf' || !targetPanel.tabs) return prev;
      const newTab: TabType = {
        id: Date.now().toString(),
        title,
        isActive: true,
        documentId: docId,
        filePath
      };
      const newTabs = targetPanel.tabs.map(t => ({ ...t, isActive: false }));
      newTabs.push(newTab);
      const updateNode = (node: PanelNode): PanelNode => {
        if (node.id === targetId && node.type === 'leaf') {
          return { ...node, tabs: newTabs };
        }
        if (node.children) return { ...node, children: node.children.map(updateNode) };
        return node;
      };
      setLastActivePanelId(targetId);
      return updateNode(prev);
    });
  }, [findPanelById, findFirstLeafPanelId, lastActivePanelId]);

  const handleRevealInExplorer = useCallback((panelId: string) => (id: string) => {
    // 在网页环境中，我们可以显示文件路径或其他相关信息
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      const filePath = targetTab.filePath || `/${targetTab.title}`;
      // 在Web环境中，我们可以尝试打开文件管理器或显示信息
      if (targetTab.filePath) {
        // 如果有真实文件路径，尝试在新标签页中打开
        window.open(`file://${targetTab.filePath}`, '_blank');
      } else {
        // 否则显示文件信息
        alert(`文件信息:\n标题: ${targetTab.title}\n位置: ${filePath}\n类型: ${targetTab.documentId ? '文档' : '新文件'}`);
      }
    }
  }, [panelTree, findPanelById]);

  const splitPanel = useCallback((panelId: string, direction: 'horizontal' | 'vertical') => {
    setPanelTree(prevTree =>
      splitPanelImmutable(prevTree, panelId, direction, () => ({ id: Date.now().toString(), title: '新标签页', isActive: true, documentId: createDocument('新标签页') } as any))
    );
  }, [createDocument]);

  const removePanelNode = useCallback((panelId: string) => {
    setPanelTree(prevTree => removePanelNodeImmutable(prevTree, panelId));
  }, []);

  const handleCloseTab = useCallback((panelId: string) => (id: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const newTabs = panel.tabs.filter(tab => tab.id !== id);
    
    if (newTabs.length === 0) {
      // 如果是根面板或唯一面板，保留一个新标签
      const isRootPanel = panelTree.id === panelId;
      const isOnlyPanel = panelTree.type === 'leaf';
      
      if (isRootPanel || isOnlyPanel) {
        const newTab = { id: Date.now().toString(), title: '新标签页', isActive: true };
        updatePanelTabs(panelId, [newTab]);
      } else {
        // 否则删除整个面板
        removePanelNode(panelId);
      }
    } else {
      const closedTab = panel.tabs.find(tab => tab.id === id);
      if (closedTab?.isActive && newTabs.length > 0) {
        newTabs[0].isActive = true;
      }
      updatePanelTabs(panelId, newTabs);
    }
  }, [panelTree, findPanelById, updatePanelTabs, removePanelNode]);

  const handleActivateTab = useCallback((panelId: string) => (id: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const newTabs = panel.tabs.map(tab => ({ ...tab, isActive: tab.id === id }));
    updatePanelTabs(panelId, newTabs);
    pushHistory(panelId, id);
    setLastActivePanelId(panelId);
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleAddTab = useCallback((panelId: string) => () => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const documentId = createDocument('新标签页', { content: '', language: 'markdown' });
    const newTab = {
      id: Date.now().toString(),
      title: '新标签页',
      isActive: false,
      documentId
    } as TabType;
    const newTabs = [...panel.tabs, newTab];
    updatePanelTabs(panelId, newTabs);
  }, [panelTree, findPanelById, updatePanelTabs, createDocument]);

  const handleCloseOthers = useCallback((panelId: string) => (id: string) => {
    const panel = findPanelById(panelTree, panelId);
    if (!panel?.tabs) return;

    const targetTab = panel.tabs.find(tab => tab.id === id);
    if (targetTab) {
      updatePanelTabs(panelId, [{ ...targetTab, isActive: true }]);
    }
  }, [panelTree, findPanelById, updatePanelTabs]);

  const handleCloseAll = useCallback((panelId: string) => () => {
    const newTab = { id: Date.now().toString(), title: '新标签页', isActive: true };
    updatePanelTabs(panelId, [newTab]);
  }, [updatePanelTabs]);

  const handleSplitHorizontal = useCallback((panelId: string) => (id: string) => {
    splitPanel(panelId, 'horizontal');
  }, [splitPanel]);

  const handleSplitVertical = useCallback((panelId: string) => (id: string) => {
    splitPanel(panelId, 'vertical');
  }, [splitPanel]);

  const renderPanelNode = useCallback((node: PanelNode): React.ReactElement => {
    if (node.type === 'leaf' && node.tabs) {
      return (
        <div className="h-full flex flex-col">
          <TabBar
            tabs={node.tabs}
            onCloseTab={handleCloseTab(node.id)}
            onActivateTab={handleActivateTab(node.id)}
            onAddTab={handleAddTab(node.id)}
            onCloseOthers={handleCloseOthers(node.id)}
            onCloseAll={handleCloseAll(node.id)}
            onSplitHorizontal={handleSplitHorizontal(node.id)}
            onSplitVertical={handleSplitVertical(node.id)}
            onToggleLock={handleToggleLock(node.id)}
            onDuplicate={handleDuplicate(node.id)}
            onRename={handleRename(node.id)}
            onCopyPath={handleCopyPath(node.id)}
            onRevealInExplorer={handleRevealInExplorer(node.id)}
            onReorderTabs={(newTabs) => updatePanelTabs(node.id, newTabs)}
            onBack={() => goBack(node.id)}
            onForward={() => goForward(node.id)}
            panelId={node.id}
          />
          <div className="flex flex-1 min-h-0">
            <div className="flex flex-1 min-w-0">
              <div className="flex-1">
                <Editor documentId={node.tabs.find(t => t.isActive)?.documentId} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (node.type === 'split' && node.children && node.children.length > 0) {
      return (
        <PanelGroup direction={node.direction || 'horizontal'}>
          {node.children.map((child, index) => (
            <React.Fragment key={child.id}>
              <Panel 
                defaultSize={child.size || 50} 
                minSize={child.minSize || 20}
                className={node.direction === 'horizontal' && index === 0 ? 'border-r border-border' : ''}
              >
                {renderPanelNode(child)}
              </Panel>
              {index < node.children!.length - 1 && (
                <PanelResizeHandle 
                  className={node.direction === 'horizontal' 
                    ? "w-1 bg-border hover:bg-accent transition-colors duration-200" 
                    : "h-1 bg-border hover:bg-accent transition-colors duration-200"
                  } 
                />
              )}
            </React.Fragment>
          ))}
        </PanelGroup>
      );
    }

    return <div>Error: Invalid panel configuration</div>;
  }, [
    handleCloseTab,
    handleActivateTab,
    handleAddTab,
    handleCloseOthers,
    handleCloseAll,
    handleSplitHorizontal,
    handleSplitVertical,
    handleToggleLock,
    handleDuplicate,
    handleRename,
    handleCopyPath,
    handleRevealInExplorer
  ]);

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-panel border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Obsidian Clone</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWorkspaceManager(true)}
            className="p-1 hover:bg-nav-hover rounded"
            title="工作区管理 (Ctrl+Shift+S)"
          >
            <Layout className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => setShowWorkspaceManager(true)}
            className="p-1 hover:bg-nav-hover rounded"
            title="保存工作区"
          >
            <Save className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        
        <div className="flex-1 min-w-0">
          {renderPanelNode(panelTree)}
        </div>
      </div>
      
      {/* Workspace Manager */}
      <WorkspaceManager
        isOpen={showWorkspaceManager}
        onClose={() => setShowWorkspaceManager(false)}
        currentPanelTree={panelTree}
        onLoadLayout={handleLoadWorkspaceLayout}
      />
    </div>
  );
};

export default ObsidianLayout;