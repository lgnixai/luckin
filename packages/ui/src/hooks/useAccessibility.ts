import { useEffect, useState, useCallback, useRef } from 'react';
import {
  announceToScreenReader,
  detectHighContrastMode,
  watchHighContrastMode,
  isScreenReaderActive,
  FocusTrap,
  KeyboardNavigationManager,
  KEYBOARD_KEYS,
  SCREEN_READER_MESSAGES
} from "@/utils/accessibility-utils';

/**
 * 可访问性配置接口
 */
export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  enableFocusTrapping: boolean;
  announceChanges: boolean;
  reducedMotion: boolean;
}

/**
 * 可访问性状态接口
 */
export interface AccessibilityState {
  isHighContrast: boolean;
  isScreenReaderActive: boolean;
  isReducedMotion: boolean;
  currentFocus: string | null;
}

/**
 * 主要的可访问性 Hook
 */
export function useAccessibility(config: Partial<AccessibilityConfig> = {}) {
  const defaultConfig: AccessibilityConfig = {
    enableScreenReader: true,
    enableKeyboardNavigation: true,
    enableHighContrast: true,
    enableFocusTrapping: true,
    announceChanges: true,
    reducedMotion: false
  };

  const finalConfig = { ...defaultConfig, ...config };

  const [state, setState] = useState<AccessibilityState>({
    isHighContrast: detectHighContrastMode(),
    isScreenReaderActive: isScreenReaderActive(),
    isReducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false,
    currentFocus: null
  });

  // 监听高对比度模式变化
  useEffect(() => {
    if (!finalConfig.enableHighContrast) return;

    const cleanup = watchHighContrastMode((isHighContrast) => {
      setState(prev => ({ ...prev, isHighContrast }));
    });

    return cleanup;
  }, [finalConfig.enableHighContrast]);

  // 监听减少动画偏好
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;

    const handleChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isReducedMotion: e.matches }));
    };

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // 屏幕阅读器公告函数
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (finalConfig.announceChanges && finalConfig.enableScreenReader) {
      announceToScreenReader(message, priority);
    }
  }, [finalConfig.announceChanges, finalConfig.enableScreenReader]);

  // 焦点管理
  const trackFocus = useCallback((elementId: string) => {
    setState(prev => ({ ...prev, currentFocus: elementId }));
  }, []);

  return {
    config: finalConfig,
    state,
    announce,
    trackFocus
  };
}

/**
 * 键盘导航 Hook
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement>,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
  enabled: boolean = true
) {
  const navigationManagerRef = useRef<KeyboardNavigationManager | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    navigationManagerRef.current = new KeyboardNavigationManager(
      containerRef.current,
      orientation
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (navigationManagerRef.current) {
        navigationManagerRef.current.handleKeyDown(e);
      }
    };

    containerRef.current.addEventListener('keydown', handleKeyDown);

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [containerRef, orientation, enabled]);

  const updateElements = useCallback(() => {
    if (navigationManagerRef.current) {
      navigationManagerRef.current.updateElements();
    }
  }, []);

  return { updateElements };
}

/**
 * 焦点陷阱 Hook
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean = false
) {
  const focusTrapRef = useRef<FocusTrap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    focusTrapRef.current = new FocusTrap(containerRef.current);

    if (isActive) {
      focusTrapRef.current.activate();
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
    };
  }, [containerRef, isActive]);

  useEffect(() => {
    if (!focusTrapRef.current) return;

    if (isActive) {
      focusTrapRef.current.activate();
    } else {
      focusTrapRef.current.deactivate();
    }
  }, [isActive]);
}

/**
 * 标签页可访问性 Hook
 */
export function useTabAccessibility() {
  const { announce } = useAccessibility();

  const announceTabOpened = useCallback((title: string) => {
    announce(SCREEN_READER_MESSAGES.TAB_OPENED(title));
  }, [announce]);

  const announceTabClosed = useCallback((title: string) => {
    announce(SCREEN_READER_MESSAGES.TAB_CLOSED(title));
  }, [announce]);

  const announceTabSwitched = useCallback((title: string) => {
    announce(SCREEN_READER_MESSAGES.TAB_SWITCHED(title));
  }, [announce]);

  const announceContentChanged = useCallback(() => {
    announce(SCREEN_READER_MESSAGES.CONTENT_CHANGED, 'polite');
  }, [announce]);

  const announceDragStarted = useCallback((title: string) => {
    announce(SCREEN_READER_MESSAGES.DRAG_STARTED(title));
  }, [announce]);

  const announceDragEnded = useCallback(() => {
    announce(SCREEN_READER_MESSAGES.DRAG_ENDED);
  }, [announce]);

  return {
    announceTabOpened,
    announceTabClosed,
    announceTabSwitched,
    announceContentChanged,
    announceDragStarted,
    announceDragEnded
  };
}

/**
 * 面板可访问性 Hook
 */
export function usePaneAccessibility() {
  const { announce } = useAccessibility();

  const announcePaneCreated = useCallback(() => {
    announce(SCREEN_READER_MESSAGES.PANE_CREATED);
  }, [announce]);

  const announcePaneClosed = useCallback(() => {
    announce(SCREEN_READER_MESSAGES.PANE_CLOSED);
  }, [announce]);

  const announceSplitCreated = useCallback((direction: 'horizontal' | 'vertical') => {
    announce(SCREEN_READER_MESSAGES.SPLIT_CREATED(direction));
  }, [announce]);

  return {
    announcePaneCreated,
    announcePaneClosed,
    announceSplitCreated
  };
}

/**
 * 菜单可访问性 Hook
 */
export function useMenuAccessibility() {
  const { announce } = useAccessibility();

  const announceMenuOpened = useCallback(() => {
    announce(SCREEN_READER_MESSAGES.MENU_OPENED);
  }, [announce]);

  const announceMenuClosed = useCallback(() => {
    announce(SCREEN_READER_MESSAGES.MENU_CLOSED);
  }, [announce]);

  const handleMenuKeyDown = useCallback((
    e: React.KeyboardEvent,
    onClose: () => void,
    onItemSelect?: (index: number) => void,
    itemCount: number = 0
  ) => {
    switch (e.key) {
      case KEYBOARD_KEYS.ESCAPE:
        e.preventDefault();
        onClose();
        announceMenuClosed();
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        e.preventDefault();
        if (onItemSelect) {
          // 实现菜单项导航逻辑
        }
        break;
      case KEYBOARD_KEYS.ARROW_UP:
        e.preventDefault();
        if (onItemSelect) {
          // 实现菜单项导航逻辑
        }
        break;
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        e.preventDefault();
        // 激活当前菜单项
        break;
    }
  }, [announce, announceMenuClosed]);

  return {
    announceMenuOpened,
    announceMenuClosed,
    handleMenuKeyDown
  };
}

/**
 * 文件操作可访问性 Hook
 */
export function useFileAccessibility() {
  const { announce } = useAccessibility();

  const announceFileSaved = useCallback((title: string) => {
    announce(SCREEN_READER_MESSAGES.FILE_SAVED(title));
  }, [announce]);

  return {
    announceFileSaved
  };
}

/**
 * 全局键盘快捷键 Hook
 */
export function useGlobalKeyboardShortcuts(
  shortcuts: Record<string, () => void>,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 构建快捷键字符串
      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push('ctrl');
      if (e.shiftKey) parts.push('shift');
      if (e.altKey) parts.push('alt');
      parts.push(e.key.toLowerCase());
      
      const shortcutKey = parts.join('+');
      
      if (shortcuts[shortcutKey]) {
        e.preventDefault();
        shortcuts[shortcutKey]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * 高对比度主题 Hook
 */
export function useHighContrastTheme() {
  const [isHighContrast, setIsHighContrast] = useState(detectHighContrastMode());

  useEffect(() => {
    const cleanup = watchHighContrastMode(setIsHighContrast);
    return cleanup;
  }, []);

  // 应用高对比度样式
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  return isHighContrast;
}