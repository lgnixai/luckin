import type { PanelNode } from '../types';

// Generic tab type used in panel operations. We only rely on id and isActive.
type PanelTab = { id: string; isActive?: boolean } & Record<string, any>;

export function findNodeById(node: PanelNode | undefined, id: string): PanelNode | null {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
}

export function findFirstLeaf(node: PanelNode | undefined): PanelNode | null {
  if (!node) return null;
  if (node.type === 'leaf') return node;
  for (const child of node.children || []) {
    const found = findFirstLeaf(child);
    if (found) return found;
  }
  return null;
}

export function updateTabsForPanel(
  tree: PanelNode,
  panelId: string,
  newTabs: PanelTab[]
): PanelNode {
  const visit = (node: PanelNode): PanelNode => {
    if (node.id === panelId && node.type === 'leaf') {
      return { ...node, tabs: newTabs as any };
    }
    if (node.children) {
      return { ...node, children: node.children.map(visit) } as PanelNode;
    }
    return node;
  };
  return visit(tree);
}

export function addTabToPanelImmutable(
  tree: PanelNode,
  panelId: string,
  tab: PanelTab,
  makeActive = true
): PanelNode {
  const visit = (node: PanelNode): PanelNode => {
    if (node.id === panelId && node.type === 'leaf') {
      const tabs: PanelTab[] = (node.tabs as any as PanelTab[]) || [];
      const nextTabs = tabs.map(t => ({ ...t, isActive: makeActive ? false : t.isActive }));
      nextTabs.push({ ...tab, isActive: makeActive ? true : tab.isActive });
      return { ...node, tabs: nextTabs as any };
    }
    if (node.children) return { ...node, children: node.children.map(visit) } as PanelNode;
    return node;
  };
  return visit(tree);
}

export function activateTabInPanelImmutable(
  tree: PanelNode,
  panelId: string,
  tabId: string
): PanelNode {
  const visit = (node: PanelNode): PanelNode => {
    if (node.id === panelId && node.type === 'leaf' && node.tabs) {
      const nextTabs = (node.tabs as any as PanelTab[]).map(t => ({ ...t, isActive: t.id === tabId }));
      return { ...node, tabs: nextTabs as any };
    }
    if (node.children) return { ...node, children: node.children.map(visit) } as PanelNode;
    return node;
  };
  return visit(tree);
}

export function closeTabInPanelImmutable(
  tree: PanelNode,
  panelId: string,
  tabId: string
): PanelNode {
  const visit = (node: PanelNode): PanelNode => {
    if (node.id === panelId && node.type === 'leaf' && node.tabs) {
      const tabs: PanelTab[] = node.tabs as any;
      const idx = tabs.findIndex(t => t.id === tabId);
      if (idx === -1) return node;
      const wasActive = !!tabs[idx].isActive;
      const nextTabs = tabs.filter(t => t.id !== tabId);
      if (wasActive && nextTabs.length > 0) {
        nextTabs[nextTabs.length - 1] = { ...nextTabs[nextTabs.length - 1], isActive: true };
      }
      return { ...node, tabs: nextTabs as any };
    }
    if (node.children) return { ...node, children: node.children.map(visit) } as PanelNode;
    return node;
  };
  return visit(tree);
}

export function splitPanelImmutable(
  tree: PanelNode,
  panelId: string,
  direction: 'horizontal' | 'vertical',
  createNewTab: () => PanelTab
): PanelNode {
  const visit = (node: PanelNode): PanelNode => {
    if (node.id === panelId && node.type === 'leaf') {
      const originalTabs: PanelTab[] = (node.tabs as any as PanelTab[]) || [];
      const activeTab = originalTabs.find(t => t.isActive);
      const newTab = activeTab ? { ...activeTab, id: `${activeTab.id}-copy-${Date.now()}`, isActive: true } : createNewTab();
      const leftLeaf: PanelNode = { id: `${node.id}-a`, type: 'leaf', tabs: originalTabs as any, size: 50, minSize: 20 };
      const rightLeaf: PanelNode = { id: `${node.id}-split-${Date.now()}`, type: 'leaf', tabs: [newTab] as any, size: 50, minSize: 20 };
      return {
        id: node.id,
        type: 'split',
        direction,
        children: [leftLeaf, rightLeaf],
        size: node.size,
        minSize: node.minSize,
      } as PanelNode;
    }
    if (node.children) return { ...node, children: node.children.map(visit) } as PanelNode;
    return node;
  };
  return visit(tree);
}

export function removePanelNodeImmutable(tree: PanelNode, panelId: string): PanelNode {
  function removeNode(node: PanelNode): PanelNode | null {
    if (node.id === panelId) return null;
    if (node.children) {
      const newChildren = node.children
        .map(child => removeNode(child))
        .filter((child): child is PanelNode => child !== null);
      if (newChildren.length === 1 && node.type === 'split') {
        const only = newChildren[0];
        return { ...only, size: node.size } as PanelNode;
      }
      return { ...node, children: newChildren } as PanelNode;
    }
    return node;
  }

  const result = removeNode(tree);
  if (!result) {
    return {
      id: 'root',
      type: 'leaf',
      tabs: [{ id: `new-${Date.now()}`, title: '新标签页', isActive: true }] as any,
    } as PanelNode;
  }
  return result;
}

