// UI组件类型定义

import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import type { UniqueId } from '../core/common';

// 基础组件属性
export interface IBaseComponentProps {
  readonly id?: UniqueId;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  readonly testId?: string;
}

// 按钮组件
export interface IButtonProps extends IBaseComponentProps {
  readonly variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  readonly size?: 'sm' | 'md' | 'lg' | 'icon';
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly icon?: ReactNode;
  readonly iconPosition?: 'left' | 'right';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

// 输入框组件
export interface IInputProps extends IBaseComponentProps {
  readonly type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'url' | 'tel';
  readonly value?: string;
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly error?: string;
  readonly helperText?: string;
  readonly startIcon?: ReactNode;
  readonly endIcon?: ReactNode;
  readonly clearable?: boolean;
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onClear?: () => void;
}

// 下拉选择组件
export interface ISelectProps<T = any> extends IBaseComponentProps {
  readonly value?: T;
  readonly defaultValue?: T;
  readonly options: ISelectOption<T>[];
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly clearable?: boolean;
  readonly searchable?: boolean;
  readonly multiple?: boolean;
  readonly loading?: boolean;
  readonly error?: string;
  readonly helperText?: string;
  onChange?: (value: T | T[], option: ISelectOption<T> | ISelectOption<T>[]) => void;
  onSearch?: (query: string) => void;
}

export interface ISelectOption<T = any> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly description?: string;
}

// 对话框组件
export interface IDialogProps extends IBaseComponentProps {
  readonly open: boolean;
  readonly title?: string;
  readonly description?: string;
  readonly size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  readonly closable?: boolean;
  readonly maskClosable?: boolean;
  readonly footer?: ReactNode;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly confirmLoading?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// 通知组件
export interface INotificationProps extends IBaseComponentProps {
  readonly type?: 'info' | 'success' | 'warning' | 'error';
  readonly title?: string;
  readonly message: string;
  readonly duration?: number;
  readonly closable?: boolean;
  readonly action?: {
    readonly label: string;
    readonly onClick: () => void;
  };
  onClose?: () => void;
}

// 工具提示组件
export interface ITooltipProps extends IBaseComponentProps {
  readonly content: ReactNode;
  readonly placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  readonly trigger?: 'hover' | 'click' | 'focus' | 'contextMenu';
  readonly delay?: number;
  readonly arrow?: boolean;
  readonly disabled?: boolean;
}

// 标签页组件
export interface ITabsProps extends IBaseComponentProps {
  readonly activeKey?: string;
  readonly defaultActiveKey?: string;
  readonly type?: 'line' | 'card' | 'editable-card';
  readonly size?: 'sm' | 'md' | 'lg';
  readonly position?: 'top' | 'bottom' | 'left' | 'right';
  readonly closable?: boolean;
  readonly addable?: boolean;
  onChange?: (activeKey: string) => void;
  onEdit?: (targetKey: string, action: 'add' | 'remove') => void;
}

export interface ITabPaneProps extends IBaseComponentProps {
  readonly key: string;
  readonly tab: ReactNode;
  readonly disabled?: boolean;
  readonly closable?: boolean;
  readonly forceRender?: boolean;
}

// 树形组件
export interface ITreeProps<T = any> extends IBaseComponentProps {
  readonly data: ITreeNode<T>[];
  readonly selectedKeys?: string[];
  readonly expandedKeys?: string[];
  readonly checkedKeys?: string[];
  readonly checkable?: boolean;
  readonly selectable?: boolean;
  readonly multiple?: boolean;
  readonly draggable?: boolean;
  readonly showLine?: boolean;
  readonly showIcon?: boolean;
  readonly virtual?: boolean;
  readonly height?: number;
  onSelect?: (selectedKeys: string[], info: { selected: boolean; selectedNodes: ITreeNode<T>[] }) => void;
  onCheck?: (checkedKeys: string[], info: { checkedNodes: ITreeNode<T>[] }) => void;
  onExpand?: (expandedKeys: string[], info: { expanded: boolean; node: ITreeNode<T> }) => void;
  onDrop?: (info: { dragNode: ITreeNode<T>; node: ITreeNode<T>; dropPosition: number }) => void;
}

export interface ITreeNode<T = any> {
  readonly key: string;
  readonly title: ReactNode;
  readonly children?: ITreeNode<T>[];
  readonly disabled?: boolean;
  readonly disableCheckbox?: boolean;
  readonly selectable?: boolean;
  readonly checkable?: boolean;
  readonly icon?: ReactNode;
  readonly isLeaf?: boolean;
  readonly data?: T;
}

// 菜单组件
export interface IMenuProps extends IBaseComponentProps {
  readonly selectedKeys?: string[];
  readonly openKeys?: string[];
  readonly mode?: 'vertical' | 'horizontal' | 'inline';
  readonly theme?: 'light' | 'dark';
  readonly inlineCollapsed?: boolean;
  readonly selectable?: boolean;
  readonly multiple?: boolean;
  onSelect?: (selectedKeys: string[], info: { key: string; selectedKeys: string[] }) => void;
  onOpenChange?: (openKeys: string[]) => void;
}

export interface IMenuItemProps extends IBaseComponentProps {
  readonly key: string;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly danger?: boolean;
  onClick?: (info: { key: string; keyPath: string[] }) => void;
}

export interface ISubMenuProps extends IBaseComponentProps {
  readonly key: string;
  readonly title: ReactNode;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
}

// 表格组件
export interface ITableProps<T = any> extends IBaseComponentProps {
  readonly columns: ITableColumn<T>[];
  readonly dataSource: T[];
  readonly rowKey?: string | ((record: T) => string);
  readonly loading?: boolean;
  readonly pagination?: ITablePagination | false;
  readonly scroll?: { x?: number; y?: number };
  readonly size?: 'sm' | 'md' | 'lg';
  readonly bordered?: boolean;
  readonly showHeader?: boolean;
  readonly rowSelection?: ITableRowSelection<T>;
  readonly expandable?: ITableExpandable<T>;
  onChange?: (pagination: ITablePagination, filters: Record<string, any>, sorter: ITableSorter) => void;
  onRow?: (record: T, index: number) => HTMLAttributes<HTMLTableRowElement>;
}

export interface ITableColumn<T = any> {
  readonly key?: string;
  readonly dataIndex?: keyof T;
  readonly title: ReactNode;
  readonly width?: number | string;
  readonly align?: 'left' | 'center' | 'right';
  readonly fixed?: 'left' | 'right';
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly filters?: ITableFilter[];
  readonly render?: (value: any, record: T, index: number) => ReactNode;
}

export interface ITablePagination {
  readonly current: number;
  readonly pageSize: number;
  readonly total: number;
  readonly showSizeChanger?: boolean;
  readonly showQuickJumper?: boolean;
  readonly showTotal?: (total: number, range: [number, number]) => ReactNode;
}

export interface ITableRowSelection<T = any> {
  readonly type?: 'checkbox' | 'radio';
  readonly selectedRowKeys?: string[];
  readonly onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  readonly getCheckboxProps?: (record: T) => { disabled?: boolean };
}

export interface ITableExpandable<T = any> {
  readonly expandedRowKeys?: string[];
  readonly expandRowByClick?: boolean;
  readonly expandIcon?: (props: { expanded: boolean; onExpand: () => void; record: T }) => ReactNode;
  readonly expandedRowRender?: (record: T, index: number) => ReactNode;
  readonly onExpand?: (expanded: boolean, record: T) => void;
  readonly onExpandedRowsChange?: (expandedKeys: string[]) => void;
}

export interface ITableFilter {
  readonly text: string;
  readonly value: any;
}

export interface ITableSorter {
  readonly field?: string;
  readonly order?: 'ascend' | 'descend';
}

// 虚拟滚动组件
export interface IVirtualScrollProps extends IBaseComponentProps {
  readonly height: number;
  readonly itemCount: number;
  readonly itemSize: number | ((index: number) => number);
  readonly overscan?: number;
  readonly scrollToIndex?: number;
  readonly scrollToAlignment?: 'auto' | 'start' | 'center' | 'end';
  renderItem: (props: { index: number; style: CSSProperties }) => ReactNode;
  onScroll?: (props: { scrollTop: number; scrollLeft: number }) => void;
}

// 拖拽组件
export interface IDragDropProps extends IBaseComponentProps {
  readonly draggable?: boolean;
  readonly droppable?: boolean;
  readonly dragData?: any;
  readonly dropTypes?: string[];
  readonly dragPreview?: ReactNode;
  onDragStart?: (data: any) => void;
  onDragEnd?: (data: any) => void;
  onDrop?: (data: any, dropResult: any) => void;
  onDragOver?: (data: any) => boolean;
}

// 快捷键组件
export interface IShortcutProps {
  readonly keys: string | string[];
  readonly global?: boolean;
  readonly preventDefault?: boolean;
  readonly stopPropagation?: boolean;
  readonly enabled?: boolean;
  onTrigger: (event: KeyboardEvent) => void;
}