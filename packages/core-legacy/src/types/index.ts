// Core types for Luckin 3.x
export type UniqueId = string | number;

export interface IMenuItemProps {
  id: UniqueId;
  name: string;
  title?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
  index?: number;
  render?: (item: IMenuItemProps) => React.ReactNode;
  onClick?: (item: IMenuItemProps) => void;
}

export interface IExtension {
  id: UniqueId;
  name: string;
  version: string;
  displayName?: string;
  description?: string;
  author?: string;
  homepage?: string;
  repository?: string;
  bugs?: string;
  license?: string;
  main?: string;
  contributes?: IContribute;
  activationEvents?: string[];
  activate?: (context: ILuckinContext, monaco: any) => void | Promise<void>;
  deactivate?: () => void | Promise<void>;
}

export interface IContribute {
  actions?: IMenuItemProps[];
  menus?: IMenuContribute[];
  keybindings?: IKeybinding[];
  themes?: IColorTheme[];
  locales?: ILocale[];
  views?: IViewContribute[];
  commands?: ICommand[];
}

export interface IMenuContribute {
  id: string;
  title: string;
  when?: string;
  group?: string;
  order?: number;
}

export interface IKeybinding {
  key: string;
  command: string;
  when?: string;
  mac?: string;
  linux?: string;
  win?: string;
}

export interface IColorTheme {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  path: string;
}

export interface ILocale {
  languageId: string;
  languageName: string;
  localizedLanguageName: string;
  translations: Record<string, string>;
}

export interface IViewContribute {
  id: string;
  name: string;
  when?: string;
  type?: 'tree' | 'webview' | 'terminal';
}

export interface ICommand {
  id: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface ILuckinContext {
  // Core services
  locale: any;
  builtin: any;
  contextMenu: any;
  auxiliaryBar: any;
  layout: any;
  statusBar: any;
  menuBar: any;
  activityBar: any;
  sidebar: any;
  explorer: any;
  folderTree: any;
  panel: any;
  output: any;
  editor: any;
  colorTheme: any;
  action: any;
  editorTree: any;
  notification: any;
  search: any;
  settings: any;
  monaco: any;
  module: any;
  extension: any;
}

// Editor types
export interface IEditorTab {
  id: UniqueId;
  name: string;
  data: any;
  modified?: boolean;
  icon?: string;
  closable?: boolean;
  editable?: boolean;
  readonly?: boolean;
  language?: string;
}

export interface IEditorGroup {
  id: UniqueId;
  activeTab?: UniqueId;
  tabs: IEditorTab[];
}

// Obsidian-style editor types
export interface TabType {
  id: string;
  title: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface PanelNode {
  id: string;
  type: 'leaf' | 'split';
  direction?: 'horizontal' | 'vertical';
  tabs?: TabType[];
  children?: PanelNode[];
  size?: number;
  minSize?: number;
}

// Layout types
export interface ILayout {
  splitPanePos: number[];
  horizontalSplitPanePos: number[];
  activityBar: {
    hidden: boolean;
  };
  activityItems?: { id: string; label: string; icon?: string }[];
  panel: {
    hidden: boolean;
    current?: UniqueId;
    tabs?: { id: string; label: string }[];
  };
  sidebar: {
    hidden: boolean;
    current?: UniqueId;
  };
  auxiliaryBar: {
    hidden: boolean;
    current?: UniqueId;
  };
  menuBar: {
    hidden: boolean;
  };
  statusBar: {
    hidden: boolean;
    text?: string;
  };
}

// Theme types
export interface IColorTheme {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
  path: string;
  colors?: Record<string, string>;
  tokenColors?: any[];
}

// Notification types
export interface INotificationItem {
  id: UniqueId;
  value: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  closable?: boolean;
}

// Search types
export interface ISearchResult {
  id: UniqueId;
  value: string;
  description?: string;
  icon?: string;
}

// Settings types
export interface ISetting {
  id: UniqueId;
  key: string;
  value: any;
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  enum?: any[];
  enumDescriptions?: string[];
}

// File system types
export interface IFileTreeNode {
  id: UniqueId;
  name: string;
  fileType: 'File' | 'Folder';
  children?: IFileTreeNode[];
  icon?: string;
  isLeaf?: boolean;
  data?: any;
}

// Event types
export interface IEvent {
  type: string;
  payload?: any;
}

// Hook types
export interface IUseLuckinReturn {
  luckin: ILuckinContext;
  monaco: any;
  localize: (key: string, defaultValue?: string) => string;
  modules: any;
  controllers: any;
}

// Configuration types
export interface ILuckinConfig {
  extensions?: IExtension[];
  defaultLocale?: string;
  defaultColorTheme?: string;
  onigurumPath?: string;
}

