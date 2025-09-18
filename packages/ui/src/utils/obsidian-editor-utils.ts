import { Tab, EditorPane, EditorSettings } from "@/types/obsidian-editor';

// ID 生成器
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 创建默认标签页
export const createDefaultTab = (options: Partial<Tab> = {}): Tab => {
  const now = new Date();
  
  return {
    id: generateId(),
    title: 'Untitled',
    content: '',
    isDirty: false,
    isLocked: false,
    type: 'file',
    encoding: 'UTF-8',
    lineEnding: 'LF',
    createdAt: now,
    modifiedAt: now,
    ...options
  };
};

// 创建默认面板
export const createDefaultPane = (options: Partial<EditorPane> = {}): EditorPane => {
  return {
    id: generateId(),
    tabs: [],
    activeTab: '',
    position: {
      x: 0,
      y: 0,
      width: 100,
      height: 100
    },
    ...options
  };
};

// 创建默认设置
export const createDefaultSettings = (): EditorSettings => {
  return {
    fontSize: 14,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    theme: 'auto',
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
    autoSave: true,
    autoSaveDelay: 2000,
    responsive: {
      autoMergePanes: true,
      adaptiveTabWidth: true,
      touchOptimized: true,
      mobileBreakpoint: 768,
      tabletBreakpoint: 1024
    }
  };
};

// 文件类型检测
export const getFileLanguage = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'json': 'json',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'md': 'markdown',
    'markdown': 'markdown',
    'py': 'python',
    'java': 'java',
    'cpp': 'cpp',
    'c': 'c',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'dockerfile': 'dockerfile',
    'vue': 'vue',
    'svelte': 'svelte'
  };
  
  return languageMap[extension || ''] || 'plaintext';
};

// 获取文件图标
export const getFileIcon = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, string> = {
    'js': '📄',
    'jsx': '⚛️',
    'ts': '📘',
    'tsx': '⚛️',
    'json': '📋',
    'html': '🌐',
    'css': '🎨',
    'scss': '🎨',
    'md': '📝',
    'py': '🐍',
    'java': '☕',
    'cpp': '⚙️',
    'c': '⚙️',
    'php': '🐘',
    'rb': '💎',
    'go': '🐹',
    'rs': '🦀',
    'xml': '📄',
    'yaml': '📄',
    'sql': '🗃️',
    'sh': '💻',
    'dockerfile': '🐳',
    'vue': '💚',
    'svelte': '🧡'
  };
  
  return iconMap[extension || ''] || '📄';
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化时间
export const formatTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)} 分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)} 小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)} 天前`;
  } else {
    return date.toLocaleDateString();
  }
};

// 截断文本
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// 验证文件名
export const isValidFileName = (fileName: string): boolean => {
  const invalidChars = /[<>:"/\\|?*]/;
  return !invalidChars.test(fileName) && fileName.trim().length > 0;
};

// 生成唯一文件名
export const generateUniqueFileName = (baseName: string, existingNames: string[]): string => {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  
  const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
  const extension = baseName.includes('.') ? baseName.split('.').pop() : '';
  
  let counter = 1;
  let newName: string;
  
  do {
    newName = extension 
      ? `${nameWithoutExt} (${counter}).${extension}`
      : `${nameWithoutExt} (${counter})`;
    counter++;
  } while (existingNames.includes(newName));
  
  return newName;
};

// 深度克隆对象
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 键盘快捷键匹配
export const matchesShortcut = (
  event: KeyboardEvent,
  shortcut: string
): boolean => {
  const keys = shortcut.toLowerCase().split('+');
  const eventKeys: string[] = [];
  
  if (event.ctrlKey || event.metaKey) eventKeys.push('ctrl');
  if (event.altKey) eventKeys.push('alt');
  if (event.shiftKey) eventKeys.push('shift');
  eventKeys.push(event.key.toLowerCase());
  
  return keys.length === eventKeys.length && 
         keys.every(key => eventKeys.includes(key));
};

// 计算拖拽位置
export const calculateDropPosition = (
  event: DragEvent,
  element: HTMLElement
): { zone: string; index?: number } => {
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  // 判断拖拽区域
  if (Math.abs(x - centerX) > Math.abs(y - centerY)) {
    return {
      zone: x < centerX ? 'split-vertical-left' : 'split-vertical-right'
    };
  } else {
    return {
      zone: y < centerY ? 'split-horizontal-top' : 'split-horizontal-bottom'
    };
  }
};

// 本地存储工具
export const storage = {
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  get: <T>(key: string, defaultValue?: T): T | undefined => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
};