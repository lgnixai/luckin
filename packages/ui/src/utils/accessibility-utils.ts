/**
 * Accessibility utilities for the Obsidian-style editor
 * Provides keyboard navigation, ARIA support, and screen reader utilities
 */

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace'
} as const;

// ARIA roles and properties
export const ARIA_ROLES = {
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUBAR: 'menubar',
  BUTTON: 'button',
  DIALOG: 'dialog',
  REGION: 'region',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  BANNER: 'banner',
  CONTENTINFO: 'contentinfo',
  APPLICATION: 'application'
} as const;

// Screen reader announcements
export const SCREEN_READER_MESSAGES = {
  TAB_OPENED: (title: string) => `标签页 ${title} 已打开`,
  TAB_CLOSED: (title: string) => `标签页 ${title} 已关闭`,
  TAB_SWITCHED: (title: string) => `切换到标签页 ${title}`,
  PANE_CREATED: '新面板已创建',
  PANE_CLOSED: '面板已关闭',
  SPLIT_CREATED: (direction: string) => `${direction === 'horizontal' ? '水平' : '垂直'}分屏已创建`,
  FILE_SAVED: (title: string) => `文件 ${title} 已保存`,
  CONTENT_CHANGED: '内容已修改',
  MENU_OPENED: '菜单已打开',
  MENU_CLOSED: '菜单已关闭',
  DRAG_STARTED: (title: string) => `开始拖拽标签页 ${title}`,
  DRAG_ENDED: '拖拽结束',
  FOCUS_MOVED: (element: string) => `焦点移动到 ${element}`
} as const;

// Keyboard shortcut descriptions
export const KEYBOARD_SHORTCUTS = {
  NEW_TAB: { keys: 'Ctrl+T', description: '新建标签页' },
  CLOSE_TAB: { keys: 'Ctrl+W', description: '关闭当前标签页' },
  NEXT_TAB: { keys: 'Ctrl+Tab', description: '切换到下一个标签页' },
  PREV_TAB: { keys: 'Ctrl+Shift+Tab', description: '切换到上一个标签页' },
  SAVE_FILE: { keys: 'Ctrl+S', description: '保存文件' },
  NEW_FILE: { keys: 'Ctrl+N', description: '新建文件' },
  OPEN_FILE: { keys: 'Ctrl+O', description: '打开文件' },
  FIND: { keys: 'Ctrl+F', description: '查找' },
  REPLACE: { keys: 'Ctrl+H', description: '替换' },
  SPLIT_HORIZONTAL: { keys: 'Ctrl+Shift+H', description: '水平分屏' },
  SPLIT_VERTICAL: { keys: 'Ctrl+Shift+V', description: '垂直分屏' },
  FOCUS_NEXT_PANE: { keys: 'Ctrl+Alt+Right', description: '焦点移动到下一个面板' },
  FOCUS_PREV_PANE: { keys: 'Ctrl+Alt+Left', description: '焦点移动到上一个面板' },
  TOGGLE_MENU: { keys: 'Alt+M', description: '打开/关闭菜单' },
  ESCAPE: { keys: 'Escape', description: '关闭对话框或菜单' }
} as const;

/**
 * 创建屏幕阅读器公告
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // 清理公告元素
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * 检查元素是否可聚焦
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;
  if (element.hasAttribute('disabled')) return false;
  if (element.getAttribute('aria-hidden') === 'true') return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  
  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['input', 'button', 'select', 'textarea', 'a', 'area'];
  
  return focusableTags.includes(tagName) || element.tabIndex >= 0;
}

/**
 * 获取容器内所有可聚焦元素
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    'area[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ];
  
  const elements = container.querySelectorAll(focusableSelectors.join(','));
  return Array.from(elements).filter(el => isFocusable(el as HTMLElement)) as HTMLElement[];
}

/**
 * 管理焦点陷阱（用于模态对话框）
 */
export class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.focusableElements = getFocusableElements(container);
    this.firstFocusable = this.focusableElements[0] || null;
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1] || null;
    this.previouslyFocused = document.activeElement as HTMLElement;
  }

  activate() {
    this.container.addEventListener('keydown', this.handleKeyDown);
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }
  }

  deactivate() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== KEYBOARD_KEYS.TAB) return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        e.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        e.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * 键盘导航管理器
 */
export class KeyboardNavigationManager {
  private elements: HTMLElement[] = [];
  private currentIndex = -1;
  private container: HTMLElement;
  private orientation: 'horizontal' | 'vertical' = 'horizontal';

  constructor(container: HTMLElement, orientation: 'horizontal' | 'vertical' = 'horizontal') {
    this.container = container;
    this.orientation = orientation;
    this.updateElements();
  }

  updateElements() {
    this.elements = getFocusableElements(this.container);
    this.currentIndex = this.elements.findIndex(el => el === document.activeElement);
  }

  handleKeyDown(e: KeyboardEvent): boolean {
    const { key } = e;
    let handled = false;

    switch (key) {
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (this.orientation === 'horizontal') {
          this.moveNext();
          handled = true;
        }
        break;
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (this.orientation === 'horizontal') {
          this.movePrevious();
          handled = true;
        }
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (this.orientation === 'vertical') {
          this.moveNext();
          handled = true;
        }
        break;
      case KEYBOARD_KEYS.ARROW_UP:
        if (this.orientation === 'vertical') {
          this.movePrevious();
          handled = true;
        }
        break;
      case KEYBOARD_KEYS.HOME:
        this.moveToFirst();
        handled = true;
        break;
      case KEYBOARD_KEYS.END:
        this.moveToLast();
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }

    return handled;
  }

  private moveNext() {
    if (this.elements.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.elements.length;
    this.focusCurrent();
  }

  private movePrevious() {
    if (this.elements.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.elements.length) % this.elements.length;
    this.focusCurrent();
  }

  private moveToFirst() {
    if (this.elements.length === 0) return;
    this.currentIndex = 0;
    this.focusCurrent();
  }

  private moveToLast() {
    if (this.elements.length === 0) return;
    this.currentIndex = this.elements.length - 1;
    this.focusCurrent();
  }

  private focusCurrent() {
    if (this.currentIndex >= 0 && this.currentIndex < this.elements.length) {
      this.elements[this.currentIndex].focus();
    }
  }
}

/**
 * 高对比度主题检测
 */
export function detectHighContrastMode(): boolean {
  // 检查系统高对比度模式
  if (window.matchMedia) {
    return window.matchMedia('(prefers-contrast: high)').matches ||
           window.matchMedia('(-ms-high-contrast: active)').matches ||
           window.matchMedia('(-ms-high-contrast: black-on-white)').matches ||
           window.matchMedia('(-ms-high-contrast: white-on-black)').matches;
  }
  return false;
}

/**
 * 监听高对比度模式变化
 */
export function watchHighContrastMode(callback: (isHighContrast: boolean) => void) {
  if (!window.matchMedia) return () => {};

  const mediaQueries = [
    '(prefers-contrast: high)',
    '(-ms-high-contrast: active)',
    '(-ms-high-contrast: black-on-white)',
    '(-ms-high-contrast: white-on-black)'
  ];

  const listeners: (() => void)[] = [];

  mediaQueries.forEach(query => {
    const mq = window.matchMedia(query);
    const listener = () => callback(detectHighContrastMode());
    mq.addListener(listener);
    listeners.push(() => mq.removeListener(listener));
  });

  // 初始调用
  callback(detectHighContrastMode());

  // 返回清理函数
  return () => {
    listeners.forEach(cleanup => cleanup());
  };
}

/**
 * 生成唯一的 ID（用于 ARIA 标签）
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建 ARIA 属性对象
 */
export function createAriaProps(props: {
  role?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  controls?: string;
  owns?: string;
  hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  level?: number;
  setSize?: number;
  posInSet?: number;
}) {
  const ariaProps: Record<string, any> = {};

  if (props.role) ariaProps.role = props.role;
  if (props.label) ariaProps['aria-label'] = props.label;
  if (props.labelledBy) ariaProps['aria-labelledby'] = props.labelledBy;
  if (props.describedBy) ariaProps['aria-describedby'] = props.describedBy;
  if (props.expanded !== undefined) ariaProps['aria-expanded'] = props.expanded;
  if (props.selected !== undefined) ariaProps['aria-selected'] = props.selected;
  if (props.disabled !== undefined) ariaProps['aria-disabled'] = props.disabled;
  if (props.hidden !== undefined) ariaProps['aria-hidden'] = props.hidden;
  if (props.live) ariaProps['aria-live'] = props.live;
  if (props.atomic !== undefined) ariaProps['aria-atomic'] = props.atomic;
  if (props.controls) ariaProps['aria-controls'] = props.controls;
  if (props.owns) ariaProps['aria-owns'] = props.owns;
  if (props.hasPopup !== undefined) ariaProps['aria-haspopup'] = props.hasPopup;
  if (props.level !== undefined) ariaProps['aria-level'] = props.level;
  if (props.setSize !== undefined) ariaProps['aria-setsize'] = props.setSize;
  if (props.posInSet !== undefined) ariaProps['aria-posinset'] = props.posInSet;

  return ariaProps;
}

/**
 * 检查是否启用了屏幕阅读器
 */
export function isScreenReaderActive(): boolean {
  // 检查常见的屏幕阅读器指示器
  return !!(
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS') ||
    navigator.userAgent.includes('VoiceOver') ||
    window.speechSynthesis ||
    (window as any).speechSynthesis
  );
}

/**
 * 为元素添加跳过链接
 */
export function createSkipLink(targetId: string, text: string): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-primary focus:text-primary-foreground';
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return skipLink;
}