// UI事件类型定义

import type { ReactNode } from 'react';
import type { UniqueId } from '../core/common';

// 基础事件接口
export interface IUIEvent<T = any> {
  readonly type: string;
  readonly target?: EventTarget;
  readonly currentTarget?: EventTarget;
  readonly timeStamp: number;
  readonly data?: T;
  preventDefault(): void;
  stopPropagation(): void;
}

// 鼠标事件
export interface IMouseEvent extends IUIEvent {
  readonly button: number;
  readonly buttons: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

// 键盘事件
export interface IKeyboardEvent extends IUIEvent {
  readonly key: string;
  readonly code: string;
  readonly keyCode: number;
  readonly charCode: number;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly repeat: boolean;
  readonly location: number;
}

// 焦点事件
export interface IFocusEvent extends IUIEvent {
  readonly relatedTarget?: EventTarget;
}

// 拖拽事件
export interface IDragEvent extends IMouseEvent {
  readonly dataTransfer: DataTransfer;
}

// 触摸事件
export interface ITouchEvent extends IUIEvent {
  readonly touches: TouchList;
  readonly targetTouches: TouchList;
  readonly changedTouches: TouchList;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

// 滚轮事件
export interface IWheelEvent extends IMouseEvent {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly deltaZ: number;
  readonly deltaMode: number;
}

// 输入事件
export interface IInputEvent extends IUIEvent {
  readonly inputType: string;
  readonly data: string | null;
  readonly isComposing: boolean;
}

// 组合输入事件
export interface ICompositionEvent extends IUIEvent {
  readonly data: string;
}

// 剪贴板事件
export interface IClipboardEvent extends IUIEvent {
  readonly clipboardData: DataTransfer;
}

// 表单事件
export interface IFormEvent extends IUIEvent {
  readonly target: HTMLFormElement;
}

// 选择事件
export interface ISelectionEvent extends IUIEvent {
  readonly selection?: Selection;
}

// 动画事件
export interface IAnimationEvent extends IUIEvent {
  readonly animationName: string;
  readonly elapsedTime: number;
  readonly pseudoElement: string;
}

// 过渡事件
export interface ITransitionEvent extends IUIEvent {
  readonly propertyName: string;
  readonly elapsedTime: number;
  readonly pseudoElement: string;
}

// 媒体事件
export interface IMediaEvent extends IUIEvent {
  readonly target: HTMLMediaElement;
}

// 进度事件
export interface IProgressEvent extends IUIEvent {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
}

// 错误事件
export interface IErrorEvent extends IUIEvent {
  readonly message: string;
  readonly filename: string;
  readonly lineno: number;
  readonly colno: number;
  readonly error: Error;
}

// 自定义UI事件
export interface ICustomUIEvent<T = any> extends IUIEvent<T> {
  readonly detail: T;
}

// 组件事件处理器类型
export type IEventHandler<E extends IUIEvent = IUIEvent> = (event: E) => void;
export type IMouseEventHandler = IEventHandler<IMouseEvent>;
export type IKeyboardEventHandler = IEventHandler<IKeyboardEvent>;
export type IFocusEventHandler = IEventHandler<IFocusEvent>;
export type IDragEventHandler = IEventHandler<IDragEvent>;
export type ITouchEventHandler = IEventHandler<ITouchEvent>;
export type IWheelEventHandler = IEventHandler<IWheelEvent>;
export type IInputEventHandler = IEventHandler<IInputEvent>;
export type ICompositionEventHandler = IEventHandler<ICompositionEvent>;
export type IClipboardEventHandler = IEventHandler<IClipboardEvent>;
export type IFormEventHandler = IEventHandler<IFormEvent>;
export type ISelectionEventHandler = IEventHandler<ISelectionEvent>;
export type IAnimationEventHandler = IEventHandler<IAnimationEvent>;
export type ITransitionEventHandler = IEventHandler<ITransitionEvent>;
export type IMediaEventHandler = IEventHandler<IMediaEvent>;
export type IProgressEventHandler = IEventHandler<IProgressEvent>;
export type IErrorEventHandler = IEventHandler<IErrorEvent>;

// 组件生命周期事件
export interface IComponentLifecycleEvent extends IUIEvent {
  readonly componentId: UniqueId;
  readonly phase: ComponentLifecyclePhase;
}

export enum ComponentLifecyclePhase {
  Mount = 'mount',
  Update = 'update',
  Unmount = 'unmount',
  Error = 'error'
}

// 路由事件
export interface IRouteEvent extends IUIEvent {
  readonly from: string;
  readonly to: string;
  readonly params?: Record<string, string>;
  readonly query?: Record<string, string>;
}

// 窗口事件
export interface IWindowEvent extends IUIEvent {
  readonly windowId: UniqueId;
  readonly action: WindowAction;
}

export enum WindowAction {
  Open = 'open',
  Close = 'close',
  Focus = 'focus',
  Blur = 'blur',
  Minimize = 'minimize',
  Maximize = 'maximize',
  Restore = 'restore',
  Resize = 'resize',
  Move = 'move'
}

// 通知事件
export interface INotificationEvent extends IUIEvent {
  readonly notificationId: UniqueId;
  readonly action: NotificationAction;
  readonly content?: ReactNode;
}

export enum NotificationAction {
  Show = 'show',
  Hide = 'hide',
  Click = 'click',
  Close = 'close',
  Action = 'action'
}

// 命令事件
export interface ICommandEvent extends IUIEvent {
  readonly commandId: string;
  readonly args?: any[];
  readonly source: CommandSource;
}

export enum CommandSource {
  Menu = 'menu',
  Keyboard = 'keyboard',
  CommandPalette = 'commandPalette',
  Button = 'button',
  API = 'api'
}

// 主题事件
export interface IThemeEvent extends IUIEvent {
  readonly themeId: string;
  readonly previousThemeId?: string;
}

// 布局事件
export interface ILayoutEvent extends IUIEvent {
  readonly area: string;
  readonly action: LayoutAction;
  readonly size?: { width: number; height: number };
  readonly position?: { x: number; y: number };
}

export enum LayoutAction {
  Show = 'show',
  Hide = 'hide',
  Resize = 'resize',
  Move = 'move',
  Focus = 'focus',
  Blur = 'blur'
}

// 编辑器事件
export interface IEditorEvent extends IUIEvent {
  readonly editorId: UniqueId;
  readonly tabId?: UniqueId;
  readonly action: EditorAction;
  readonly content?: string;
  readonly selection?: { start: number; end: number };
}

export enum EditorAction {
  Open = 'open',
  Close = 'close',
  Save = 'save',
  Change = 'change',
  Focus = 'focus',
  Blur = 'blur',
  SelectionChange = 'selectionChange',
  CursorChange = 'cursorChange'
}

// 文件系统事件
export interface IFileSystemEvent extends IUIEvent {
  readonly path: string;
  readonly action: FileSystemAction;
  readonly isDirectory: boolean;
}

export enum FileSystemAction {
  Create = 'create',
  Delete = 'delete',
  Rename = 'rename',
  Move = 'move',
  Change = 'change'
}

// 搜索事件
export interface ISearchEvent extends IUIEvent {
  readonly query: string;
  readonly results?: any[];
  readonly resultCount?: number;
  readonly searchId?: UniqueId;
}

// 设置事件
export interface ISettingsEvent extends IUIEvent {
  readonly key: string;
  readonly value: any;
  readonly previousValue?: any;
  readonly scope: SettingsScope;
}

export enum SettingsScope {
  User = 'user',
  Workspace = 'workspace',
  Folder = 'folder'
}