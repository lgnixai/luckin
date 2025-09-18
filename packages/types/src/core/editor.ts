// 编辑器核心类型定义

import type { UniqueId, IEventEmitter, Disposable, IRange, ISelection, IPosition, IRectangle, ISize } from './common';

// 编辑器标签页
export interface IEditorTab {
  readonly id: UniqueId;
  readonly name: string;
  readonly path?: string;
  readonly content: string;
  readonly language: string;
  readonly encoding?: string;
  readonly lineEnding?: 'LF' | 'CRLF';
  readonly isDirty: boolean;
  readonly isReadOnly: boolean;
  readonly isPreview?: boolean;
  readonly isPinned?: boolean;
  readonly metadata?: Record<string, any>;
  readonly createdAt: Date;
  readonly modifiedAt: Date;
}

// 编辑器组
export interface IEditorGroup {
  readonly id: UniqueId;
  readonly tabs: IEditorTab[];
  readonly activeTabId?: UniqueId;
  readonly isActive: boolean;
  readonly direction?: 'horizontal' | 'vertical';
}

// 编辑器面板
export interface IEditorPane {
  readonly id: UniqueId;
  readonly groups: IEditorGroup[];
  readonly activeGroupId?: UniqueId;
  readonly position: IRectangle;
  readonly isActive: boolean;
}

// 编辑器布局
export interface IEditorLayout {
  readonly type: 'single' | 'split';
  readonly panes: IEditorPane[];
  readonly activePaneId?: UniqueId;
  readonly splitters?: IEditorSplitter[];
}

// 编辑器分割器
export interface IEditorSplitter {
  readonly id: UniqueId;
  readonly direction: 'horizontal' | 'vertical';
  readonly position: number; // 0-1之间的比例
  readonly paneAId: UniqueId;
  readonly paneBId: UniqueId;
  readonly isResizing?: boolean;
}

// 编辑器选项
export interface IEditorOptions {
  readonly fontSize?: number;
  readonly fontFamily?: string;
  readonly fontWeight?: string;
  readonly lineHeight?: number;
  readonly tabSize?: number;
  readonly insertSpaces?: boolean;
  readonly wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
  readonly wordWrapColumn?: number;
  readonly lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
  readonly rulers?: number[];
  readonly folding?: boolean;
  readonly foldingStrategy?: 'auto' | 'indentation';
  readonly showFoldingControls?: 'always' | 'mouseover';
  readonly minimap?: {
    enabled: boolean;
    side?: 'left' | 'right';
    showSlider?: 'always' | 'mouseover';
    scale?: number;
  };
  readonly scrollbar?: {
    vertical?: 'auto' | 'visible' | 'hidden';
    horizontal?: 'auto' | 'visible' | 'hidden';
    verticalScrollbarSize?: number;
    horizontalScrollbarSize?: number;
  };
  readonly find?: {
    seedSearchStringFromSelection?: 'always' | 'never' | 'selection';
    autoFindInSelection?: 'always' | 'never' | 'multiline';
  };
}

// 编辑器状态
export interface IEditorState {
  readonly layout: IEditorLayout;
  readonly options: IEditorOptions;
  readonly recentFiles: string[];
  readonly pinnedFiles: string[];
}

// 编辑器服务接口
export interface IEditorService extends Disposable {
  readonly onDidCreateTab: IEventEmitter<IEditorTab>;
  readonly onDidCloseTab: IEventEmitter<UniqueId>;
  readonly onDidChangeActiveTab: IEventEmitter<UniqueId>;
  readonly onDidChangeTabContent: IEventEmitter<{ tabId: UniqueId; content: string }>;
  readonly onDidSaveTab: IEventEmitter<UniqueId>;
  
  // 标签页操作
  createTab(options: Partial<IEditorTab>): Promise<UniqueId>;
  openFile(path: string, options?: { preview?: boolean; split?: boolean }): Promise<UniqueId>;
  closeTab(tabId: UniqueId, force?: boolean): Promise<boolean>;
  saveTab(tabId: UniqueId): Promise<boolean>;
  saveAllTabs(): Promise<boolean>;
  switchToTab(tabId: UniqueId): void;
  
  // 组操作
  createGroup(options?: { direction?: 'horizontal' | 'vertical' }): UniqueId;
  closeGroup(groupId: UniqueId, force?: boolean): Promise<boolean>;
  moveTabToGroup(tabId: UniqueId, targetGroupId: UniqueId, index?: number): void;
  
  // 面板操作
  splitPane(paneId: UniqueId, direction: 'horizontal' | 'vertical'): UniqueId;
  closePane(paneId: UniqueId, force?: boolean): Promise<boolean>;
  resizePane(paneId: UniqueId, size: ISize): void;
  
  // 查询
  getTab(tabId: UniqueId): IEditorTab | undefined;
  getActiveTab(): IEditorTab | undefined;
  getAllTabs(): IEditorTab[];
  getTabsByGroup(groupId: UniqueId): IEditorTab[];
  getGroup(groupId: UniqueId): IEditorGroup | undefined;
  getActiveGroup(): IEditorGroup | undefined;
  getPane(paneId: UniqueId): IEditorPane | undefined;
  getActivePane(): IEditorPane | undefined;
}

// 编辑器内容提供者
export interface IEditorContentProvider {
  readonly scheme: string;
  provideTextContent(uri: string): Promise<string | undefined>;
}

// 编辑器装饰
export interface IEditorDecoration {
  readonly range: IRange;
  readonly options: IEditorDecorationOptions;
}

export interface IEditorDecorationOptions {
  readonly className?: string;
  readonly hoverMessage?: string;
  readonly glyphMarginClassName?: string;
  readonly glyphMarginHoverMessage?: string;
  readonly isWholeLine?: boolean;
  readonly inlineClassName?: string;
  readonly inlineClassNameAffectsLetterSpacing?: boolean;
  readonly beforeContentClassName?: string;
  readonly afterContentClassName?: string;
  readonly zIndex?: number;
}

// 编辑器模型
export interface IEditorModel extends Disposable {
  readonly uri: string;
  readonly language: string;
  readonly version: number;
  readonly lineCount: number;
  readonly isReadOnly: boolean;
  
  getValue(eol?: string): string;
  setValue(value: string): void;
  getLineContent(lineNumber: number): string;
  getWordAtPosition(position: IPosition): { word: string; startColumn: number; endColumn: number } | null;
  
  readonly onDidChangeContent: IEventEmitter<{ changes: IModelContentChange[] }>;
  readonly onDidChangeLanguage: IEventEmitter<{ oldLanguage: string; newLanguage: string }>;
}

export interface IModelContentChange {
  readonly range: IRange;
  readonly rangeOffset: number;
  readonly rangeLength: number;
  readonly text: string;
}

// 编辑器视图
export interface IEditorView extends Disposable {
  readonly model: IEditorModel | undefined;
  readonly selection: ISelection | undefined;
  readonly selections: ISelection[];
  readonly visibleRanges: IRange[];
  
  setModel(model: IEditorModel | undefined): void;
  focus(): void;
  hasTextFocus(): boolean;
  
  getPosition(): IPosition | undefined;
  setPosition(position: IPosition): void;
  getSelection(): ISelection | undefined;
  setSelection(selection: ISelection): void;
  setSelections(selections: ISelection[]): void;
  
  revealLine(lineNumber: number): void;
  revealLineInCenter(lineNumber: number): void;
  revealPosition(position: IPosition): void;
  revealPositionInCenter(position: IPosition): void;
  revealRange(range: IRange): void;
  revealRangeInCenter(range: IRange): void;
  
  deltaDecorations(oldDecorations: string[], newDecorations: IEditorDecoration[]): string[];
  
  readonly onDidChangeCursorPosition: IEventEmitter<{ position: IPosition; selection: ISelection }>;
  readonly onDidChangeSelection: IEventEmitter<{ selection: ISelection; selections: ISelection[] }>;
  readonly onDidFocusEditorText: IEventEmitter<void>;
  readonly onDidBlurEditorText: IEventEmitter<void>;
}