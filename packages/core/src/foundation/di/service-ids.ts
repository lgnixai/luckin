// 服务标识符常量定义

// 核心服务标识符
export const ServiceIds = {
  // 基础服务
  Configuration: 'configuration',
  EventBus: 'eventBus',
  Logger: 'logger',
  
  // 编辑器服务
  EditorService: 'editorService',
  EditorModelService: 'editorModelService',
  EditorViewService: 'editorViewService',
  
  // 布局服务
  LayoutService: 'layoutService',
  WorkbenchService: 'workbenchService',
  
  // 主题服务
  ThemeService: 'themeService',
  IconThemeService: 'iconThemeService',
  
  // 文件系统服务
  FileService: 'fileService',
  FileSystemWatcher: 'fileSystemWatcher',
  
  // 命令服务
  CommandService: 'commandService',
  KeybindingService: 'keybindingService',
  
  // 菜单服务
  MenuService: 'menuService',
  ContextMenuService: 'contextMenuService',
  
  // 通知服务
  NotificationService: 'notificationService',
  MessageService: 'messageService',
  
  // 搜索服务
  SearchService: 'searchService',
  
  // 国际化服务
  I18nService: 'i18nService',
  LocalizationService: 'localizationService',
  
  // 扩展服务
  ExtensionService: 'extensionService',
  ExtensionRegistry: 'extensionRegistry',
  
  // 设置服务
  SettingsService: 'settingsService',
  PreferencesService: 'preferencesService',
  
  // 工作区服务
  WorkspaceService: 'workspaceService',
  ProjectService: 'projectService',
  
  // 终端服务
  TerminalService: 'terminalService',
  
  // 调试服务
  DebugService: 'debugService',
  
  // 测试服务
  TestService: 'testService',
  
  // 存储服务
  StorageService: 'storageService',
  StateService: 'stateService',
  
  // 网络服务
  HttpService: 'httpService',
  DownloadService: 'downloadService',
  
  // 安全服务
  AuthService: 'authService',
  SecurityService: 'securityService',
  
  // 性能服务
  PerformanceService: 'performanceService',
  TelemetryService: 'telemetryService'
} as const;

// 服务标识符类型
export type ServiceId = typeof ServiceIds[keyof typeof ServiceIds];