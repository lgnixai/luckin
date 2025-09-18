// 共享常量定义

// 应用信息
export const APP_INFO = {
  NAME: 'Luckin',
  VERSION: '3.0.0-alpha.0',
  DESCRIPTION: 'A modern Web IDE UI Framework built with React.js and shadcn/ui, inspired by VSCode.',
  AUTHOR: 'LGINX AI Corporation',
  LICENSE: 'MIT',
  HOMEPAGE: 'https://github.com/lginxai/luckin',
  REPOSITORY: 'https://github.com/lginxai/luckin.git'
} as const;

// 存储键名
export const STORAGE_KEYS = {
  // 配置相关
  CONFIG: 'config',
  USER_SETTINGS: 'userSettings',
  WORKSPACE_SETTINGS: 'workspaceSettings',
  
  // 会话相关
  SESSION_STATE: 'sessionState',
  EDITOR_STATE: 'editorState',
  LAYOUT_STATE: 'layoutState',
  
  // 主题相关
  CURRENT_THEME: 'currentTheme',
  CUSTOM_THEMES: 'customThemes',
  
  // 扩展相关
  INSTALLED_EXTENSIONS: 'installedExtensions',
  EXTENSION_STATES: 'extensionStates',
  
  // 缓存相关
  FILE_CACHE: 'fileCache',
  RECENT_FILES: 'recentFiles',
  RECENT_WORKSPACES: 'recentWorkspaces'
} as const;

// 事件类型
export const EVENT_TYPES = {
  // 应用生命周期
  APP_READY: 'app:ready',
  APP_SHUTDOWN: 'app:shutdown',
  
  // 主题事件
  THEME_CHANGED: 'theme:changed',
  THEME_REGISTERED: 'theme:registered',
  THEME_UNREGISTERED: 'theme:unregistered',
  
  // 布局事件
  LAYOUT_CHANGED: 'layout:changed',
  LAYOUT_AREA_TOGGLED: 'layout:area:toggled',
  LAYOUT_AREA_RESIZED: 'layout:area:resized',
  
  // 编辑器事件
  EDITOR_TAB_OPENED: 'editor:tab:opened',
  EDITOR_TAB_CLOSED: 'editor:tab:closed',
  EDITOR_TAB_SWITCHED: 'editor:tab:switched',
  EDITOR_CONTENT_CHANGED: 'editor:content:changed',
  EDITOR_SELECTION_CHANGED: 'editor:selection:changed',
  
  // 文件系统事件
  FILE_OPENED: 'file:opened',
  FILE_SAVED: 'file:saved',
  FILE_CREATED: 'file:created',
  FILE_DELETED: 'file:deleted',
  FILE_RENAMED: 'file:renamed',
  
  // 扩展事件
  EXTENSION_ACTIVATED: 'extension:activated',
  EXTENSION_DEACTIVATED: 'extension:deactivated',
  EXTENSION_INSTALLED: 'extension:installed',
  EXTENSION_UNINSTALLED: 'extension:uninstalled',
  
  // 通知事件
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide',
  
  // 命令事件
  COMMAND_EXECUTED: 'command:executed',
  COMMAND_REGISTERED: 'command:registered',
  COMMAND_UNREGISTERED: 'command:unregistered'
} as const;

// 命令ID
export const COMMAND_IDS = {
  // 文件操作
  FILE_NEW: 'file.new',
  FILE_OPEN: 'file.open',
  FILE_SAVE: 'file.save',
  FILE_SAVE_AS: 'file.saveAs',
  FILE_SAVE_ALL: 'file.saveAll',
  FILE_CLOSE: 'file.close',
  FILE_CLOSE_ALL: 'file.closeAll',
  FILE_REVERT: 'file.revert',
  
  // 编辑操作
  EDIT_UNDO: 'edit.undo',
  EDIT_REDO: 'edit.redo',
  EDIT_CUT: 'edit.cut',
  EDIT_COPY: 'edit.copy',
  EDIT_PASTE: 'edit.paste',
  EDIT_SELECT_ALL: 'edit.selectAll',
  EDIT_FIND: 'edit.find',
  EDIT_REPLACE: 'edit.replace',
  EDIT_FIND_IN_FILES: 'edit.findInFiles',
  
  // 视图操作
  VIEW_TOGGLE_SIDEBAR: 'view.toggleSidebar',
  VIEW_TOGGLE_PANEL: 'view.togglePanel',
  VIEW_TOGGLE_ACTIVITY_BAR: 'view.toggleActivityBar',
  VIEW_TOGGLE_STATUS_BAR: 'view.toggleStatusBar',
  VIEW_TOGGLE_MENU_BAR: 'view.toggleMenuBar',
  VIEW_TOGGLE_FULLSCREEN: 'view.toggleFullscreen',
  VIEW_TOGGLE_ZEN_MODE: 'view.toggleZenMode',
  
  // 窗口操作
  WINDOW_NEW: 'window.new',
  WINDOW_CLOSE: 'window.close',
  WINDOW_RELOAD: 'window.reload',
  WINDOW_TOGGLE_DEV_TOOLS: 'window.toggleDevTools',
  
  // 主题操作
  THEME_SELECT: 'theme.select',
  THEME_TOGGLE: 'theme.toggle',
  
  // 设置操作
  SETTINGS_OPEN: 'settings.open',
  SETTINGS_OPEN_USER: 'settings.openUser',
  SETTINGS_OPEN_WORKSPACE: 'settings.openWorkspace',
  
  // 扩展操作
  EXTENSIONS_SHOW: 'extensions.show',
  EXTENSIONS_INSTALL: 'extensions.install',
  EXTENSIONS_UNINSTALL: 'extensions.uninstall',
  
  // 命令面板
  COMMAND_PALETTE_SHOW: 'commandPalette.show',
  
  // 快速打开
  QUICK_OPEN_FILE: 'quickOpen.file',
  QUICK_OPEN_SYMBOL: 'quickOpen.symbol',
  QUICK_OPEN_COMMAND: 'quickOpen.command',
  
  // 终端操作
  TERMINAL_NEW: 'terminal.new',
  TERMINAL_KILL: 'terminal.kill',
  TERMINAL_CLEAR: 'terminal.clear',
  TERMINAL_TOGGLE: 'terminal.toggle'
} as const;

// 默认快捷键
export const DEFAULT_KEYBINDINGS = {
  // 文件操作
  [COMMAND_IDS.FILE_NEW]: 'Ctrl+N',
  [COMMAND_IDS.FILE_OPEN]: 'Ctrl+O',
  [COMMAND_IDS.FILE_SAVE]: 'Ctrl+S',
  [COMMAND_IDS.FILE_SAVE_AS]: 'Ctrl+Shift+S',
  [COMMAND_IDS.FILE_SAVE_ALL]: 'Ctrl+K S',
  [COMMAND_IDS.FILE_CLOSE]: 'Ctrl+W',
  [COMMAND_IDS.FILE_CLOSE_ALL]: 'Ctrl+K Ctrl+W',
  
  // 编辑操作
  [COMMAND_IDS.EDIT_UNDO]: 'Ctrl+Z',
  [COMMAND_IDS.EDIT_REDO]: 'Ctrl+Y',
  [COMMAND_IDS.EDIT_CUT]: 'Ctrl+X',
  [COMMAND_IDS.EDIT_COPY]: 'Ctrl+C',
  [COMMAND_IDS.EDIT_PASTE]: 'Ctrl+V',
  [COMMAND_IDS.EDIT_SELECT_ALL]: 'Ctrl+A',
  [COMMAND_IDS.EDIT_FIND]: 'Ctrl+F',
  [COMMAND_IDS.EDIT_REPLACE]: 'Ctrl+H',
  [COMMAND_IDS.EDIT_FIND_IN_FILES]: 'Ctrl+Shift+F',
  
  // 视图操作
  [COMMAND_IDS.VIEW_TOGGLE_SIDEBAR]: 'Ctrl+B',
  [COMMAND_IDS.VIEW_TOGGLE_PANEL]: 'Ctrl+J',
  [COMMAND_IDS.VIEW_TOGGLE_FULLSCREEN]: 'F11',
  [COMMAND_IDS.VIEW_TOGGLE_ZEN_MODE]: 'Ctrl+K Z',
  
  // 窗口操作
  [COMMAND_IDS.WINDOW_NEW]: 'Ctrl+Shift+N',
  [COMMAND_IDS.WINDOW_CLOSE]: 'Ctrl+Shift+W',
  [COMMAND_IDS.WINDOW_RELOAD]: 'Ctrl+R',
  [COMMAND_IDS.WINDOW_TOGGLE_DEV_TOOLS]: 'F12',
  
  // 设置操作
  [COMMAND_IDS.SETTINGS_OPEN]: 'Ctrl+,',
  
  // 扩展操作
  [COMMAND_IDS.EXTENSIONS_SHOW]: 'Ctrl+Shift+X',
  
  // 命令面板
  [COMMAND_IDS.COMMAND_PALETTE_SHOW]: 'Ctrl+Shift+P',
  
  // 快速打开
  [COMMAND_IDS.QUICK_OPEN_FILE]: 'Ctrl+P',
  [COMMAND_IDS.QUICK_OPEN_SYMBOL]: 'Ctrl+Shift+O',
  
  // 终端操作
  [COMMAND_IDS.TERMINAL_NEW]: 'Ctrl+Shift+`',
  [COMMAND_IDS.TERMINAL_TOGGLE]: 'Ctrl+`'
} as const;

// 文件类型
export const FILE_TYPES = {
  TEXT: 'text',
  CODE: 'code',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  DOCUMENT: 'document',
  BINARY: 'binary'
} as const;

// 文件扩展名映射
export const FILE_EXTENSIONS = {
  // 代码文件
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.go': 'go',
  '.rs': 'rust',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.scala': 'scala',
  '.r': 'r',
  '.m': 'objective-c',
  '.mm': 'objective-cpp',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  '.ps1': 'powershell',
  '.bat': 'batch',
  '.cmd': 'batch',
  
  // 标记语言
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.xhtml': 'xml',
  '.svg': 'xml',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.tex': 'latex',
  '.rst': 'restructuredtext',
  
  // 样式文件
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.styl': 'stylus',
  
  // 配置文件
  '.json': 'json',
  '.jsonc': 'jsonc',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.ini': 'ini',
  '.cfg': 'ini',
  '.conf': 'ini',
  '.properties': 'properties',
  
  // 数据文件
  '.sql': 'sql',
  '.csv': 'csv',
  '.tsv': 'csv',
  '.log': 'log',
  
  // 文档文件
  '.txt': 'plaintext',
  '.rtf': 'rtf',
  '.pdf': 'pdf',
  '.doc': 'word',
  '.docx': 'word',
  '.xls': 'excel',
  '.xlsx': 'excel',
  '.ppt': 'powerpoint',
  '.pptx': 'powerpoint'
} as const;

// 主题类型
export const THEME_TYPES = {
  LIGHT: 'light',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast',
  HIGH_CONTRAST_LIGHT: 'high-contrast-light'
} as const;

// 布局区域
export const LAYOUT_AREAS = {
  MENU_BAR: 'menuBar',
  ACTIVITY_BAR: 'activityBar',
  SIDEBAR: 'sidebar',
  EDITOR: 'editor',
  PANEL: 'panel',
  AUXILIARY_BAR: 'auxiliaryBar',
  STATUS_BAR: 'statusBar'
} as const;

// 面板位置
export const PANEL_POSITIONS = {
  BOTTOM: 'bottom',
  RIGHT: 'right',
  LEFT: 'left'
} as const;

// 侧边栏位置
export const SIDEBAR_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right'
} as const;

// 活动栏位置
export const ACTIVITY_BAR_POSITIONS = {
  LEFT: 'left',
  RIGHT: 'right'
} as const;

// 默认配置
export const DEFAULT_CONFIG = {
  // 编辑器配置
  editor: {
    fontSize: 14,
    fontFamily: 'Consolas, "Courier New", monospace',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'off',
    lineNumbers: 'on',
    minimap: { enabled: true },
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto'
    }
  },
  
  // 工作台配置
  workbench: {
    colorTheme: 'default-dark',
    iconTheme: 'vs-seti',
    startupEditor: 'welcomePage',
    enableExperiments: false,
    
    // 布局配置
    activityBar: {
      visible: true,
      location: 'left'
    },
    sidebar: {
      location: 'left',
      restore: true
    },
    panel: {
      defaultLocation: 'bottom',
      opens: 'right'
    },
    statusBar: {
      visible: true
    },
    menuBar: {
      visibility: 'default'
    }
  },
  
  // 文件配置
  files: {
    autoSave: 'afterDelay',
    autoSaveDelay: 1000,
    encoding: 'utf8',
    eol: '\n',
    trimTrailingWhitespace: false,
    insertFinalNewline: false,
    trimFinalNewlines: false,
    maxFileSize: 50 * 1024 * 1024 // 50MB
  },
  
  // 搜索配置
  search: {
    exclude: {
      '**/node_modules': true,
      '**/bower_components': true,
      '**/*.code-search': true,
      '**/dist': true,
      '**/build': true,
      '**/.git': true,
      '**/.svn': true,
      '**/.hg': true,
      '**/CVS': true,
      '**/.DS_Store': true,
      '**/Thumbs.db': true
    },
    useRipgrep: true,
    useIgnoreFiles: true,
    useGlobalIgnoreFiles: true,
    followSymlinks: true,
    smartCase: false,
    globalFindClipboard: false,
    location: 'sidebar',
    collapseResults: 'auto'
  },
  
  // 扩展配置
  extensions: {
    autoUpdate: true,
    autoCheckUpdates: true,
    ignoreRecommendations: false,
    showRecommendationsOnlyOnDemand: false,
    closeExtensionDetailsOnViewChange: false
  },
  
  // 终端配置
  terminal: {
    integrated: {
      shell: {
        windows: 'C:\\Windows\\System32\\cmd.exe',
        linux: '/bin/bash',
        osx: '/bin/bash'
      },
      shellArgs: {
        windows: [],
        linux: [],
        osx: []
      },
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      cursorBlinking: true,
      cursorStyle: 'block',
      scrollback: 1000,
      copyOnSelection: false,
      rightClickBehavior: 'default'
    }
  }
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// 错误代码
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN: 'UNKNOWN',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
  
  // 文件系统错误
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_ACCESS_DENIED: 'FILE_ACCESS_DENIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  
  // 网络错误
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  
  // 扩展错误
  EXTENSION_NOT_FOUND: 'EXTENSION_NOT_FOUND',
  EXTENSION_LOAD_FAILED: 'EXTENSION_LOAD_FAILED',
  EXTENSION_ACTIVATION_FAILED: 'EXTENSION_ACTIVATION_FAILED',
  
  // 配置错误
  INVALID_CONFIGURATION: 'INVALID_CONFIGURATION',
  CONFIGURATION_LOAD_FAILED: 'CONFIGURATION_LOAD_FAILED',
  
  // 主题错误
  THEME_NOT_FOUND: 'THEME_NOT_FOUND',
  THEME_LOAD_FAILED: 'THEME_LOAD_FAILED',
  INVALID_THEME_FORMAT: 'INVALID_THEME_FORMAT'
} as const;