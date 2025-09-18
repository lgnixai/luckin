// 插件系统类型定义

import type { IEventEmitter, Disposable, IService } from '../core/common';
import type { IThemeContribution } from '../core/theme';

// 插件状态
export enum PluginState {
  Unloaded = 'unloaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Activating = 'activating',
  Active = 'active',
  Deactivating = 'deactivating',
  Deactivated = 'deactivated',
  Failed = 'failed'
}

// 插件元数据
export interface IPluginManifest {
  readonly id: string;
  readonly name: string;
  readonly displayName: string;
  readonly version: string;
  readonly description?: string;
  readonly author?: string;
  readonly publisher?: string;
  readonly homepage?: string;
  readonly repository?: string;
  readonly bugs?: string;
  readonly license?: string;
  readonly keywords?: string[];
  readonly categories?: string[];
  readonly main?: string;
  readonly browser?: string;
  readonly engines: {
    readonly luckin: string;
    readonly node?: string;
  };
  readonly activationEvents?: string[];
  readonly contributes?: IPluginContributions;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly extensionDependencies?: string[];
  readonly extensionPack?: string[];
  readonly icon?: string;
  readonly preview?: boolean;
  readonly enabledApiProposals?: string[];
}

// 插件贡献点
export interface IPluginContributions {
  readonly commands?: ICommandContribution[];
  readonly menus?: IMenuContribution[];
  readonly keybindings?: IKeybindingContribution[];
  readonly languages?: ILanguageContribution[];
  readonly grammars?: IGrammarContribution[];
  readonly themes?: IThemeContribution[];
  readonly iconThemes?: IIconThemeContribution[];
  readonly snippets?: ISnippetContribution[];
  readonly debuggers?: IDebuggerContribution[];
  readonly views?: IViewContribution[];
  readonly viewsContainers?: IViewContainerContribution[];
  readonly problemMatchers?: IProblemMatcherContribution[];
  readonly taskDefinitions?: ITaskDefinitionContribution[];
  readonly configuration?: IConfigurationContribution;
  readonly configurationDefaults?: Record<string, any>;
  readonly colors?: IColorContribution[];
  readonly customEditors?: ICustomEditorContribution[];
  readonly notebooks?: INotebookContribution[];
  readonly authentication?: IAuthenticationContribution[];
  readonly walkthroughs?: IWalkthroughContribution[];
}

// 命令贡献
export interface ICommandContribution {
  readonly command: string;
  readonly title: string;
  readonly category?: string;
  readonly icon?: string | { light: string; dark: string };
  readonly enablement?: string;
}

// 菜单贡献
export interface IMenuContribution {
  readonly commandPalette?: IMenuItemContribution[];
  readonly editor?: IMenuItemContribution[];
  readonly explorer?: IMenuItemContribution[];
  readonly scm?: IMenuItemContribution[];
  readonly debug?: IMenuItemContribution[];
  readonly terminal?: IMenuItemContribution[];
  readonly [key: string]: IMenuItemContribution[] | undefined;
}

export interface IMenuItemContribution {
  readonly command: string;
  readonly when?: string;
  readonly group?: string;
  readonly alt?: string;
}

// 快捷键贡献
export interface IKeybindingContribution {
  readonly command: string;
  readonly key: string;
  readonly mac?: string;
  readonly linux?: string;
  readonly win?: string;
  readonly when?: string;
  readonly args?: any;
}

// 语言贡献
export interface ILanguageContribution {
  readonly id: string;
  readonly aliases?: string[];
  readonly extensions?: string[];
  readonly filenames?: string[];
  readonly filenamePatterns?: string[];
  readonly firstLine?: string;
  readonly configuration?: string;
  readonly icon?: string | { light: string; dark: string };
}

// 语法贡献
export interface IGrammarContribution {
  readonly language: string;
  readonly scopeName: string;
  readonly path: string;
  readonly embeddedLanguages?: Record<string, string>;
  readonly tokenTypes?: Record<string, string>;
  readonly injectTo?: string[];
}


// 图标主题贡献
export interface IIconThemeContribution {
  readonly id: string;
  readonly label: string;
  readonly path: string;
}

// 代码片段贡献
export interface ISnippetContribution {
  readonly language: string;
  readonly path: string;
}

// 调试器贡献
export interface IDebuggerContribution {
  readonly type: string;
  readonly label: string;
  readonly program?: string;
  readonly runtime?: string;
  readonly configurationAttributes: any;
  readonly initialConfigurations?: any[];
  readonly configurationSnippets?: any[];
  readonly variables?: Record<string, string>;
  readonly languages?: string[];
}

// 视图贡献
export interface IViewContribution {
  readonly id: string;
  readonly name: string;
  readonly when?: string;
  readonly type?: 'tree' | 'webview';
  readonly contextualTitle?: string;
  readonly icon?: string | { light: string; dark: string };
  readonly visibility?: 'visible' | 'hidden' | 'collapsed';
}

// 视图容器贡献
export interface IViewContainerContribution {
  readonly id: string;
  readonly title: string;
  readonly icon: string | { light: string; dark: string };
}

// 问题匹配器贡献
export interface IProblemMatcherContribution {
  readonly name: string;
  readonly owner?: string;
  readonly source?: string;
  readonly applyTo?: 'allDocuments' | 'openDocuments' | 'closedDocuments';
  readonly fileLocation?: 'absolute' | 'relative' | 'autoDetect' | string[];
  readonly pattern: any;
  readonly background?: any;
  readonly watching?: any;
}

// 任务定义贡献
export interface ITaskDefinitionContribution {
  readonly type: string;
  readonly required?: string[];
  readonly properties: Record<string, any>;
}

// 配置贡献
export interface IConfigurationContribution {
  readonly title?: string;
  readonly properties: Record<string, IConfigurationProperty>;
}

export interface IConfigurationProperty {
  readonly type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  readonly description: string;
  readonly default?: any;
  readonly enum?: any[];
  readonly enumDescriptions?: string[];
  readonly minimum?: number;
  readonly maximum?: number;
  readonly pattern?: string;
  readonly patternErrorMessage?: string;
  readonly deprecationMessage?: string;
  readonly markdownDeprecationMessage?: string;
  readonly scope?: 'application' | 'machine' | 'window' | 'resource' | 'language-overridable' | 'machine-overridable';
  readonly order?: number;
  readonly tags?: string[];
}

// 颜色贡献
export interface IColorContribution {
  readonly id: string;
  readonly description: string;
  readonly defaults: {
    readonly light?: string;
    readonly dark?: string;
    readonly highContrast?: string;
    readonly highContrastLight?: string;
  };
}

// 自定义编辑器贡献
export interface ICustomEditorContribution {
  readonly viewType: string;
  readonly displayName: string;
  readonly selector: ICustomEditorSelector[];
  readonly priority?: 'default' | 'builtin' | 'option';
}

export interface ICustomEditorSelector {
  readonly filenamePattern?: string;
  readonly scheme?: string;
}

// 笔记本贡献
export interface INotebookContribution {
  readonly type: string;
  readonly displayName: string;
  readonly selector?: INotebookSelector[];
  readonly priority?: 'default' | 'builtin' | 'option';
}

export interface INotebookSelector {
  readonly filenamePattern?: string;
  readonly excludeFileNamePattern?: string;
}

// 认证贡献
export interface IAuthenticationContribution {
  readonly id: string;
  readonly label: string;
}

// 演练贡献
export interface IWalkthroughContribution {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly steps: IWalkthroughStep[];
  readonly featuredFor?: string[];
  readonly when?: string;
}

export interface IWalkthroughStep {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly media?: {
    readonly image?: string;
    readonly altText?: string;
    readonly markdown?: string;
    readonly svg?: string;
  };
  readonly completionEvents?: string[];
  readonly when?: string;
}

// 插件上下文
export interface IPluginContext {
  readonly subscriptions: Disposable[];
  readonly workspaceState: IMemento;
  readonly globalState: IMemento;
  readonly extensionPath: string;
  readonly extensionUri: string;
  readonly storagePath?: string;
  readonly globalStoragePath: string;
  readonly logPath: string;
  readonly extensionMode: PluginMode;
  readonly environmentVariableCollection: IEnvironmentVariableCollection;
  
  asAbsolutePath(relativePath: string): string;
}

export enum PluginMode {
  Production = 1,
  Development = 2,
  Test = 3
}

// 内存存储
export interface IMemento {
  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  update(key: string, value: any): Promise<void>;
}

// 环境变量集合
export interface IEnvironmentVariableCollection {
  readonly persistent: boolean;
  replace(variable: string, value: string): void;
  append(variable: string, value: string): void;
  prepend(variable: string, value: string): void;
  get(variable: string): IEnvironmentVariableMutator | undefined;
  forEach(callback: (variable: string, mutator: IEnvironmentVariableMutator, collection: IEnvironmentVariableCollection) => any, thisArg?: any): void;
  delete(variable: string): void;
  clear(): void;
}

export interface IEnvironmentVariableMutator {
  readonly type: EnvironmentVariableMutatorType;
  readonly value: string;
}

export enum EnvironmentVariableMutatorType {
  Replace = 1,
  Append = 2,
  Prepend = 3
}

// 插件实例
export interface IPlugin extends Disposable {
  readonly id: string;
  readonly manifest: IPluginManifest;
  readonly state: PluginState;
  readonly context: IPluginContext;
  readonly exports?: any;
  
  activate(context: IPluginContext): Promise<any> | any;
  deactivate?(): Promise<void> | void;
  
  readonly onDidChangeState: IEventEmitter<PluginState>;
}

// 插件服务
export interface IPluginService extends IService {
  readonly onDidInstallPlugin: IEventEmitter<IPlugin>;
  readonly onDidUninstallPlugin: IEventEmitter<string>;
  readonly onDidActivatePlugin: IEventEmitter<IPlugin>;
  readonly onDidDeactivatePlugin: IEventEmitter<IPlugin>;
  readonly onDidChangePluginState: IEventEmitter<{ plugin: IPlugin; state: PluginState }>;
  
  // 插件管理
  installPlugin(pluginPath: string): Promise<IPlugin>;
  uninstallPlugin(pluginId: string): Promise<void>;
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  
  // 插件查询
  getPlugin(pluginId: string): IPlugin | undefined;
  getPlugins(): IPlugin[];
  getActivePlugins(): IPlugin[];
  getPluginsByState(state: PluginState): IPlugin[];
  
  // 插件激活
  activatePlugin(pluginId: string): Promise<void>;
  deactivatePlugin(pluginId: string): Promise<void>;
  activateByEvent(activationEvent: string): Promise<void>;
  
  // 插件依赖
  resolveDependencies(pluginId: string): Promise<IPlugin[]>;
  getDependents(pluginId: string): IPlugin[];
  
  // 插件API
  getPluginApi(pluginId: string): any;
  exposeApi(pluginId: string, api: any): void;
}