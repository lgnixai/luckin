// 主题系统类型定义

import type { IEventEmitter, Disposable } from './common';

// 主题类型
export enum ThemeType {
  Light = 'light',
  Dark = 'dark',
  HighContrast = 'hc-black',
  HighContrastLight = 'hc-light'
}

// 颜色定义
export interface IColorDefinition {
  readonly id: string;
  readonly description: string;
  readonly defaults: {
    readonly light?: string;
    readonly dark?: string;
    readonly hcDark?: string;
    readonly hcLight?: string;
  };
}

// 主题颜色
export interface IThemeColors {
  // 基础颜色
  readonly foreground?: string;
  readonly background?: string;
  readonly border?: string;
  readonly shadow?: string;
  
  // 文本颜色
  readonly textPrimary?: string;
  readonly textSecondary?: string;
  readonly textDisabled?: string;
  readonly textLink?: string;
  readonly textLinkActive?: string;
  
  // 编辑器颜色
  readonly editorBackground?: string;
  readonly editorForeground?: string;
  readonly editorLineNumber?: string;
  readonly editorLineNumberActive?: string;
  readonly editorCursor?: string;
  readonly editorSelection?: string;
  readonly editorSelectionHighlight?: string;
  readonly editorWordHighlight?: string;
  readonly editorWordHighlightStrong?: string;
  readonly editorFindMatch?: string;
  readonly editorFindMatchHighlight?: string;
  readonly editorCurrentLine?: string;
  readonly editorIndentGuide?: string;
  readonly editorActiveIndentGuide?: string;
  
  // 界面颜色
  readonly sidebarBackground?: string;
  readonly sidebarForeground?: string;
  readonly sidebarBorder?: string;
  readonly activityBarBackground?: string;
  readonly activityBarForeground?: string;
  readonly activityBarBorder?: string;
  readonly statusBarBackground?: string;
  readonly statusBarForeground?: string;
  readonly statusBarBorder?: string;
  readonly tabActiveBackground?: string;
  readonly tabActiveForeground?: string;
  readonly tabInactiveBackground?: string;
  readonly tabInactiveForeground?: string;
  readonly tabBorder?: string;
  
  // 按钮颜色
  readonly buttonPrimaryBackground?: string;
  readonly buttonPrimaryForeground?: string;
  readonly buttonPrimaryHover?: string;
  readonly buttonSecondaryBackground?: string;
  readonly buttonSecondaryForeground?: string;
  readonly buttonSecondaryHover?: string;
  
  // 输入框颜色
  readonly inputBackground?: string;
  readonly inputForeground?: string;
  readonly inputBorder?: string;
  readonly inputFocusBorder?: string;
  readonly inputPlaceholder?: string;
  
  // 下拉菜单颜色
  readonly dropdownBackground?: string;
  readonly dropdownForeground?: string;
  readonly dropdownBorder?: string;
  readonly dropdownShadow?: string;
  
  // 列表颜色
  readonly listActiveBackground?: string;
  readonly listActiveForeground?: string;
  readonly listHoverBackground?: string;
  readonly listHoverForeground?: string;
  readonly listFocusBackground?: string;
  readonly listFocusForeground?: string;
  
  // 通知颜色
  readonly notificationBackground?: string;
  readonly notificationForeground?: string;
  readonly notificationBorder?: string;
  readonly notificationInfoBackground?: string;
  readonly notificationWarningBackground?: string;
  readonly notificationErrorBackground?: string;
  readonly notificationSuccessBackground?: string;
}

// 语法高亮规则
export interface ITokenColorRule {
  readonly scope: string | string[];
  readonly settings: {
    readonly foreground?: string;
    readonly background?: string;
    readonly fontStyle?: 'normal' | 'italic' | 'bold' | 'underline';
  };
}

// 主题定义
export interface ITheme {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly description?: string;
  readonly type: ThemeType;
  readonly colors: IThemeColors;
  readonly tokenColors: ITokenColorRule[];
  readonly semanticHighlighting?: boolean;
  readonly semanticTokenColors?: Record<string, string>;
  readonly author?: string;
  readonly version?: string;
  readonly homepage?: string;
  readonly repository?: string;
  readonly license?: string;
  readonly builtin: boolean;
}

// 主题贡献
export interface IThemeContribution {
  readonly id: string;
  readonly label: string;
  readonly uiTheme: ThemeType;
  readonly path: string;
}

// 主题服务接口
export interface IThemeService extends Disposable {
  readonly onDidChangeTheme: IEventEmitter<ITheme>;
  readonly onDidRegisterTheme: IEventEmitter<ITheme>;
  readonly onDidUnregisterTheme: IEventEmitter<string>;
  
  // 主题管理
  getCurrentTheme(): ITheme;
  setTheme(themeId: string): Promise<void>;
  getThemes(): ITheme[];
  getTheme(themeId: string): ITheme | undefined;
  
  // 主题注册
  registerTheme(theme: ITheme): void;
  unregisterTheme(themeId: string): void;
  
  // 颜色解析
  getColor(colorId: string): string | undefined;
  resolveColor(color: string | undefined): string | undefined;
  
  // 自动主题
  setAutoTheme(enabled: boolean): void;
  isAutoTheme(): boolean;
  
  // 主题导入导出
  exportTheme(themeId: string): Promise<string>;
  importTheme(themeData: string): Promise<string>;
  
  // 自定义主题
  createCustomTheme(baseThemeId: string, customizations: Partial<ITheme>): Promise<string>;
  updateCustomTheme(themeId: string, customizations: Partial<ITheme>): Promise<void>;
  deleteCustomTheme(themeId: string): Promise<void>;
}

// 图标主题
export interface IIconTheme {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly description?: string;
  readonly iconDefinitions: Record<string, IIconDefinition>;
  readonly fileExtensions?: Record<string, string>;
  readonly fileNames?: Record<string, string>;
  readonly folderNames?: Record<string, string>;
  readonly folderNamesExpanded?: Record<string, string>;
  readonly languageIds?: Record<string, string>;
  readonly light?: {
    readonly fileExtensions?: Record<string, string>;
    readonly fileNames?: Record<string, string>;
    readonly folderNames?: Record<string, string>;
    readonly folderNamesExpanded?: Record<string, string>;
  };
  readonly highContrast?: {
    readonly fileExtensions?: Record<string, string>;
    readonly fileNames?: Record<string, string>;
    readonly folderNames?: Record<string, string>;
    readonly folderNamesExpanded?: Record<string, string>;
  };
  readonly builtin: boolean;
}

export interface IIconDefinition {
  readonly iconPath: string;
  readonly fontCharacter?: string;
  readonly fontColor?: string;
  readonly fontSize?: string;
  readonly fontId?: string;
}

// 图标主题服务
export interface IIconThemeService extends Disposable {
  readonly onDidChangeIconTheme: IEventEmitter<IIconTheme>;
  
  getCurrentIconTheme(): IIconTheme;
  setIconTheme(themeId: string): Promise<void>;
  getIconThemes(): IIconTheme[];
  getIconTheme(themeId: string): IIconTheme | undefined;
  
  registerIconTheme(theme: IIconTheme): void;
  unregisterIconTheme(themeId: string): void;
  
  getFileIcon(fileName: string): string | undefined;
  getFolderIcon(folderName: string, expanded?: boolean): string | undefined;
  getLanguageIcon(languageId: string): string | undefined;
}

// 主题变量
export interface IThemeVariable {
  readonly name: string;
  readonly value: string;
  readonly description?: string;
}

// CSS变量映射
export interface ICSSVariables {
  readonly [key: string]: string;
}

// 主题构建器
export interface IThemeBuilder {
  setName(name: string): IThemeBuilder;
  setType(type: ThemeType): IThemeBuilder;
  setColors(colors: Partial<IThemeColors>): IThemeBuilder;
  setTokenColors(tokenColors: ITokenColorRule[]): IThemeBuilder;
  addTokenColor(rule: ITokenColorRule): IThemeBuilder;
  build(): ITheme;
}