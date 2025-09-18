import { useEffect, useCallback, useState } from 'react';

export interface ClosedTab {
  id: string;
  title: string;
  documentId?: string;
  filePath?: string;
}

interface ShortcutHandlers {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onJumpToTab?: (index: number) => void;
  onQuickSearch?: () => void;
  onReopenClosedTab?: () => void;
  onSplitHorizontal?: () => void;
  onSplitVertical?: () => void;
  onToggleTabGroups?: () => void;
  onDuplicateTab?: () => void;
  onLockTab?: () => void;
  onCloseOtherTabs?: () => void;
  onCloseAllTabs?: () => void;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
  onSaveWorkspace?: () => void;
}

interface ShortcutHookReturn {
  addClosedTab: (tab: ClosedTab) => void;
  getLastClosedTab: () => ClosedTab | null;
  clearClosedTabs: () => void;
}

const useShortcuts = (handlers: ShortcutHandlers = {}): ShortcutHookReturn => {
  const [closedTabs, setClosedTabs] = useState<ClosedTab[]>([]);

  const addClosedTab = useCallback((tab: ClosedTab) => {
    setClosedTabs(prev => [...prev.slice(-9), tab]); // Keep last 10 closed tabs
  }, []);

  const getLastClosedTab = useCallback(() => {
    const lastTab = closedTabs[closedTabs.length - 1];
    if (lastTab) {
      setClosedTabs(prev => prev.slice(0, -1));
      return lastTab;
    }
    return null;
  }, [closedTabs]);

  const clearClosedTabs = useCallback(() => {
    setClosedTabs([]);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const isModifier = ctrlKey || metaKey;

    // Prevent default for handled shortcuts
    let handled = false;

    // Tab management shortcuts
    if (isModifier && key === 't' && !shiftKey && !altKey) {
      handlers.onNewTab?.();
      handled = true;
    } else if (isModifier && key === 'w' && !shiftKey && !altKey) {
      handlers.onCloseTab?.();
      handled = true;
    } else if (isModifier && key === 'Tab' && !shiftKey) {
      handlers.onNextTab?.();
      handled = true;
    } else if (isModifier && key === 'Tab' && shiftKey) {
      handlers.onPrevTab?.();
      handled = true;
    } else if (isModifier && key === 'p' && !shiftKey && !altKey) {
      handlers.onQuickSearch?.();
      handled = true;
    } else if (isModifier && shiftKey && key === 'T') {
      handlers.onReopenClosedTab?.();
      handled = true;
    }
    
    // Split shortcuts
    else if (isModifier && key === '\\' && !shiftKey) {
      handlers.onSplitVertical?.();
      handled = true;
    } else if (isModifier && shiftKey && key === '\\') {
      handlers.onSplitHorizontal?.();
      handled = true;
    }
    
    // Tab group shortcuts
    else if (isModifier && shiftKey && key === 'G') {
      handlers.onToggleTabGroups?.();
      handled = true;
    } else if (isModifier && key === 'd' && !shiftKey && !altKey) {
      handlers.onDuplicateTab?.();
      handled = true;
    } else if (isModifier && key === 'l' && !shiftKey && !altKey) {
      handlers.onLockTab?.();
      handled = true;
    }
    
    // Close shortcuts
    else if (isModifier && altKey && key === 'w') {
      handlers.onCloseOtherTabs?.();
      handled = true;
    } else if (isModifier && shiftKey && key === 'W') {
      handlers.onCloseAllTabs?.();
      handled = true;
    }
    
    // Navigation shortcuts
    else if (altKey && key === 'ArrowLeft') {
      handlers.onNavigateBack?.();
      handled = true;
    } else if (altKey && key === 'ArrowRight') {
      handlers.onNavigateForward?.();
      handled = true;
    }
    
    // Workspace shortcuts
    else if (isModifier && shiftKey && key === 'S') {
      handlers.onSaveWorkspace?.();
      handled = true;
    }
    
    // Number key shortcuts for jumping to tabs
    else if (isModifier && key >= '1' && key <= '9') {
      const index = parseInt(key) - 1;
      handlers.onJumpToTab?.(index);
      handled = true;
    } else if (isModifier && key === '0') {
      handlers.onJumpToTab?.(-1); // Last tab
      handled = true;
    }

    if (handled) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);

  return {
    addClosedTab,
    getLastClosedTab,
    clearClosedTabs,
  };
};

export default useShortcuts;
