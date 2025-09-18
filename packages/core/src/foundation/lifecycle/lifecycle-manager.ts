// 生命周期管理器

import { LifecyclePhase } from '@lginxai/luckin-types';
import type { ILifecycle, IEventEmitter, Disposable } from '@lginxai/luckin-types';
import { EventBus } from '../events/event-bus';
import { LuckinError, ERROR_CODES } from '@lginxai/luckin-shared';

// 生命周期钩子函数类型
export type LifecycleHook = () => Promise<void> | void;

// 生命周期服务接口
export interface ILifecycleService extends ILifecycle {
  // 注册生命周期钩子
  onStarting(hook: LifecycleHook): Disposable;
  onReady(hook: LifecycleHook): Disposable;
  onRestored(hook: LifecycleHook): Disposable;
  onEventually(hook: LifecycleHook): Disposable;
  onShutdown(hook: LifecycleHook): Disposable;
  
  // 阶段控制
  setPhase(phase: LifecyclePhase): Promise<void>;
  shutdown(): Promise<void>;
  
  // 状态查询
  isPhase(phase: LifecyclePhase): boolean;
  canTransitionTo(phase: LifecyclePhase): boolean;
}

// 生命周期管理器实现
export class LifecycleManager implements ILifecycleService {
  private _phase: LifecyclePhase = LifecyclePhase.Starting;
  private _onDidChangePhase = new EventBus();
  private hooks = new Map<LifecyclePhase, LifecycleHook[]>();
  private shutdownHooks: LifecycleHook[] = [];
  private disposed = false;
  private transitioning = false;

  constructor() {
    // 初始化钩子映射
    this.hooks.set(LifecyclePhase.Starting, []);
    this.hooks.set(LifecyclePhase.Ready, []);
    this.hooks.set(LifecyclePhase.Restored, []);
    this.hooks.set(LifecyclePhase.Eventually, []);
  }

  get phase(): LifecyclePhase {
    return this._phase;
  }

  get onDidChangePhase(): IEventEmitter<LifecyclePhase> {
    return this._onDidChangePhase as unknown as IEventEmitter<LifecyclePhase>;
  }

  // 注册启动钩子
  onStarting(hook: LifecycleHook): Disposable {
    return this.registerHook(LifecyclePhase.Starting, hook);
  }

  // 注册就绪钩子
  onReady(hook: LifecycleHook): Disposable {
    return this.registerHook(LifecyclePhase.Ready, hook);
  }

  // 注册恢复钩子
  onRestored(hook: LifecycleHook): Disposable {
    return this.registerHook(LifecyclePhase.Restored, hook);
  }

  // 注册最终钩子
  onEventually(hook: LifecycleHook): Disposable {
    return this.registerHook(LifecyclePhase.Eventually, hook);
  }

  // 注册关闭钩子
  onShutdown(hook: LifecycleHook): Disposable {
    if (this.disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Cannot register hook on disposed lifecycle manager'
      );
    }

    this.shutdownHooks.push(hook);

    return {
      dispose: () => {
        const index = this.shutdownHooks.indexOf(hook);
        if (index !== -1) {
          this.shutdownHooks.splice(index, 1);
        }
      }
    };
  }

  // 设置生命周期阶段
  async setPhase(phase: LifecyclePhase): Promise<void> {
    if (this.disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Cannot set phase on disposed lifecycle manager'
      );
    }

    if (this.transitioning) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Lifecycle transition already in progress'
      );
    }

    if (this._phase === phase) {
      return; // 已经在目标阶段
    }

    if (!this.canTransitionTo(phase)) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Invalid lifecycle transition from ${this._phase} to ${phase}`
      );
    }

    this.transitioning = true;

    try {
      // 执行目标阶段的钩子
      await this.executeHooks(phase);
      
      // 更新阶段
      const previousPhase = this._phase;
      this._phase = phase;
      
      // 发射阶段变更事件
      this._onDidChangePhase.emit('phaseChanged', {
        previousPhase,
        currentPhase: phase
      });
    } finally {
      this.transitioning = false;
    }
  }

  // 关闭生命周期管理器
  async shutdown(): Promise<void> {
    if (this.disposed) {
      return;
    }

    this.transitioning = true;

    try {
      // 执行关闭钩子
      await this.executeShutdownHooks();
    } finally {
      this.dispose();
    }
  }

  // 检查是否在指定阶段
  isPhase(phase: LifecyclePhase): boolean {
    return this._phase === phase;
  }

  // 检查是否可以转换到指定阶段
  canTransitionTo(phase: LifecyclePhase): boolean {
    const currentPhase = this._phase;
    
    // 生命周期阶段的有效转换
    switch (currentPhase) {
      case LifecyclePhase.Starting:
        return phase === LifecyclePhase.Ready;
      
      case LifecyclePhase.Ready:
        return phase === LifecyclePhase.Restored;
      
      case LifecyclePhase.Restored:
        return phase === LifecyclePhase.Eventually;
      
      case LifecyclePhase.Eventually:
        return false; // 最终阶段，不能再转换
      
      default:
        return false;
    }
  }

  // 等待指定阶段
  async waitForPhase(phase: LifecyclePhase, timeout?: number): Promise<void> {
    if (this._phase === phase) {
      return;
    }

    if (!this.canTransitionTo(phase) && this._phase < phase) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Cannot wait for phase ${phase} from current phase ${this._phase}`
      );
    }

    // 等待阶段变更事件
    await this._onDidChangePhase.waitFor('phaseChanged', timeout, (event) => {
      return event.payload?.currentPhase === phase;
    });
  }

  // 注册钩子
  private registerHook(phase: LifecyclePhase, hook: LifecycleHook): Disposable {
    if (this.disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Cannot register hook on disposed lifecycle manager'
      );
    }

    const phaseHooks = this.hooks.get(phase);
    if (!phaseHooks) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        `Invalid lifecycle phase: ${phase}`
      );
    }

    // 如果已经过了这个阶段，立即执行钩子
    if (this._phase > phase) {
      try {
        const result = hook();
        if (result && typeof result.then === 'function') {
          result.catch(error => {
            console.error(`Error in late lifecycle hook for phase ${phase}:`, error);
          });
        }
      } catch (error) {
        console.error(`Error in late lifecycle hook for phase ${phase}:`, error);
      }
      
      // 返回空的 Disposable
      return { dispose: () => {} };
    }

    phaseHooks.push(hook);

    return {
      dispose: () => {
        const index = phaseHooks.indexOf(hook);
        if (index !== -1) {
          phaseHooks.splice(index, 1);
        }
      }
    };
  }

  // 执行指定阶段的钩子
  private async executeHooks(phase: LifecyclePhase): Promise<void> {
    const phaseHooks = this.hooks.get(phase);
    if (!phaseHooks || phaseHooks.length === 0) {
      return;
    }

    const errors: Error[] = [];

    // 顺序执行钩子
    for (const hook of phaseHooks) {
      try {
        const result = hook();
        if (result && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        console.error(`Error in lifecycle hook for phase ${phase}:`, error);
        errors.push(error as Error);
      }
    }

    // 如果有错误，抛出聚合错误
    if (errors.length > 0) {
      throw new LuckinError(
        ERROR_CODES.UNKNOWN,
        `${errors.length} error(s) occurred during lifecycle phase ${phase}`,
        false,
        errors[0]
      );
    }
  }

  // 执行关闭钩子
  private async executeShutdownHooks(): Promise<void> {
    if (this.shutdownHooks.length === 0) {
      return;
    }

    // 逆序执行关闭钩子
    const hooks = [...this.shutdownHooks].reverse();
    
    for (const hook of hooks) {
      try {
        const result = hook();
        if (result && typeof result.then === 'function') {
          await result;
        }
      } catch (error) {
        console.error('Error in shutdown hook:', error);
        // 继续执行其他关闭钩子
      }
    }
  }

  // 释放资源
  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.hooks.clear();
    this.shutdownHooks = [];
    this._onDidChangePhase.dispose();
    this.disposed = true;
  }

  // 获取统计信息
  getStats(): {
    currentPhase: LifecyclePhase;
    hookCounts: Record<string, number>;
    shutdownHookCount: number;
    isTransitioning: boolean;
    isDisposed: boolean;
  } {
    const hookCounts: Record<string, number> = {};
    
    for (const [phase, hooks] of this.hooks.entries()) {
      hookCounts[phase.toString()] = hooks.length;
    }

    return {
      currentPhase: this._phase,
      hookCounts,
      shutdownHookCount: this.shutdownHooks.length,
      isTransitioning: this.transitioning,
      isDisposed: this.disposed
    };
  }
}

// 全局生命周期管理器实例
export const globalLifecycleManager = new LifecycleManager();