// 布局系统类型定义

import type { UniqueId, IEventEmitter, Disposable, IPosition, ISize, IRectangle } from './common';

// 布局方向
export type LayoutDirection = 'horizontal' | 'vertical';

// 布局区域
export enum LayoutArea {
  MenuBar = 'menuBar',
  ActivityBar = 'activityBar',
  Sidebar = 'sidebar',
  Editor = 'editor',
  Panel = 'panel',
  AuxiliaryBar = 'auxiliaryBar',
  StatusBar = 'statusBar'
}

// 布局配置
export interface ILayoutConfig {
  readonly menuBar: {
    readonly visible: boolean;
    readonly height: number;
  };
  readonly activityBar: {
    readonly visible: boolean;
    readonly position: 'left' | 'right';
    readonly width: number;
  };
  readonly sidebar: {
    readonly visible: boolean;
    readonly position: 'left' | 'right';
    readonly width: number;
    readonly minWidth: number;
    readonly maxWidth: number;
  };
  readonly panel: {
    readonly visible: boolean;
    readonly position: 'bottom' | 'right';
    readonly size: number; // height for bottom, width for right
    readonly minSize: number;
    readonly maxSize: number;
  };
  readonly auxiliaryBar: {
    readonly visible: boolean;
    readonly width: number;
    readonly minWidth: number;
    readonly maxWidth: number;
  };
  readonly statusBar: {
    readonly visible: boolean;
    readonly height: number;
  };
  readonly editor: {
    readonly showTabs: boolean;
    readonly tabHeight: number;
    readonly splitThreshold: number;
  };
}

// 布局项
export interface ILayoutItem {
  readonly id: UniqueId;
  readonly area: LayoutArea;
  readonly visible: boolean;
  readonly size: ISize;
  readonly position: IPosition;
  readonly minSize?: ISize;
  readonly maxSize?: ISize;
  readonly resizable?: boolean;
}

// 分割器
export interface ILayoutSplitter {
  readonly id: UniqueId;
  readonly direction: LayoutDirection;
  readonly position: number; // 0-1之间的比例
  readonly itemAId: UniqueId;
  readonly itemBId: UniqueId;
  readonly thickness: number;
  readonly isActive?: boolean;
}

// 布局状态
export interface ILayoutState {
  readonly config: ILayoutConfig;
  readonly items: Record<UniqueId, ILayoutItem>;
  readonly splitters: Record<UniqueId, ILayoutSplitter>;
  readonly activeArea?: LayoutArea;
  readonly fullscreen: boolean;
  readonly zenMode: boolean;
}

// 布局服务接口
export interface ILayoutService extends Disposable {
  readonly onDidChangeLayout: IEventEmitter<ILayoutState>;
  readonly onDidChangeActiveArea: IEventEmitter<LayoutArea | undefined>;
  readonly onDidToggleArea: IEventEmitter<{ area: LayoutArea; visible: boolean }>;
  readonly onDidResizeArea: IEventEmitter<{ area: LayoutArea; size: ISize }>;
  
  // 配置管理
  getConfig(): ILayoutConfig;
  updateConfig(config: Partial<ILayoutConfig>): void;
  resetConfig(): void;
  
  // 区域管理
  isAreaVisible(area: LayoutArea): boolean;
  toggleArea(area: LayoutArea, visible?: boolean): void;
  focusArea(area: LayoutArea): void;
  getActiveArea(): LayoutArea | undefined;
  
  // 尺寸管理
  getAreaSize(area: LayoutArea): ISize;
  resizeArea(area: LayoutArea, size: Partial<ISize>): void;
  getAreaBounds(area: LayoutArea): IRectangle;
  
  // 分割器管理
  addSplitter(splitter: Omit<ILayoutSplitter, 'id'>): UniqueId;
  removeSplitter(splitterId: UniqueId): void;
  moveSplitter(splitterId: UniqueId, position: number): void;
  
  // 布局模式
  enterFullscreen(): void;
  exitFullscreen(): void;
  isFullscreen(): boolean;
  toggleFullscreen(): void;
  
  enterZenMode(): void;
  exitZenMode(): void;
  isZenMode(): boolean;
  toggleZenMode(): void;
  
  // 布局计算
  calculateLayout(): ILayoutState;
  validateLayout(state: ILayoutState): boolean;
}

// 可停靠组件
export interface IDockable {
  readonly id: UniqueId;
  readonly title: string;
  readonly icon?: string;
  readonly closable: boolean;
  readonly resizable: boolean;
  readonly area: LayoutArea;
  readonly priority?: number;
}

// 可停靠容器
export interface IDockableContainer extends Disposable {
  readonly area: LayoutArea;
  readonly items: IDockable[];
  readonly activeItemId?: UniqueId;
  
  addItem(item: IDockable): void;
  removeItem(itemId: UniqueId): void;
  activateItem(itemId: UniqueId): void;
  getItem(itemId: UniqueId): IDockable | undefined;
  
  readonly onDidAddItem: IEventEmitter<IDockable>;
  readonly onDidRemoveItem: IEventEmitter<UniqueId>;
  readonly onDidActivateItem: IEventEmitter<UniqueId>;
}

// 响应式布局
export interface IResponsiveLayout {
  readonly breakpoints: {
    readonly mobile: number;
    readonly tablet: number;
    readonly desktop: number;
    readonly wide: number;
  };
  readonly currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'wide';
  readonly isMobile: boolean;
  readonly isTablet: boolean;
  readonly isDesktop: boolean;
  readonly isWide: boolean;
  
  readonly onDidChangeBreakpoint: IEventEmitter<string>;
}

// 工作区布局
export interface IWorkspaceLayout {
  readonly id: UniqueId;
  readonly name: string;
  readonly description?: string;
  readonly state: ILayoutState;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
}

// 布局预设
export interface ILayoutPreset {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly config: Partial<ILayoutConfig>;
  readonly builtin: boolean;
}