// 通用基础类型定义

export type UniqueId = string | number;

export type Disposable = {
  dispose(): void;
};

export type AsyncDisposable = {
  dispose(): Promise<void>;
};

// 事件系统类型
export interface IEvent<T = any> {
  type: string;
  payload?: T;
  timestamp?: number;
  source?: string;
}

export interface IEventEmitter<T = any> extends Disposable {
  on(event: string, listener: (data: T) => void): Disposable;
  off(event: string, listener: (data: T) => void): void;
  emit(event: string, data?: T): void;
  once(event: string, listener: (data: T) => void): Disposable;
}

// 服务接口
export interface IService extends Disposable {
  readonly id: string;
  readonly name: string;
  initialize?(): Promise<void> | void;
}

// 配置接口
export interface IConfiguration {
  get<T>(key: string, defaultValue?: T): T;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  remove(key: string): void;
}

// 生命周期接口
export interface ILifecycle extends Disposable {
  readonly phase: LifecyclePhase;
  onDidChangePhase: IEventEmitter<LifecyclePhase>;
}

export enum LifecyclePhase {
  Starting = 1,
  Ready = 2,
  Restored = 3,
  Eventually = 4
}

// 错误处理
export interface IError {
  readonly code: string;
  readonly message: string;
  readonly stack?: string;
  readonly cause?: Error;
  readonly recoverable: boolean;
}

export class LuckinError extends Error implements IError {
  constructor(
    public readonly code: string,
    message: string,
    public readonly recoverable: boolean = false,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'LuckinError';
  }
}

// 异步操作
export interface ICancellationToken {
  readonly isCancellationRequested: boolean;
  readonly onCancellationRequested: IEventEmitter<void>;
}

export interface IProgress<T = any> {
  report(value: T): void;
}

// 位置和尺寸
export interface IPosition {
  readonly x: number;
  readonly y: number;
}

export interface ISize {
  readonly width: number;
  readonly height: number;
}

export interface IRectangle extends IPosition, ISize {}

// 范围
export interface IRange {
  readonly startLineNumber: number;
  readonly startColumn: number;
  readonly endLineNumber: number;
  readonly endColumn: number;
}

// 选择
export interface ISelection extends IRange {
  readonly selectionStartLineNumber: number;
  readonly selectionStartColumn: number;
  readonly positionLineNumber: number;
  readonly positionColumn: number;
}