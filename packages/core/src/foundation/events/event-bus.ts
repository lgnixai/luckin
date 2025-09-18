// 事件总线实现

import type { IEventEmitter, IEvent, Disposable } from '@lginxai/luckin-types';
import { LuckinError, ERROR_CODES } from '@lginxai/luckin-shared';

// 事件监听器类型
export type EventListener<T = any> = (event: IEvent<T>) => void;

// 事件过滤器类型
export type EventFilter<T = any> = (event: IEvent<T>) => boolean;

// 事件监听器选项
export interface EventListenerOptions {
  once?: boolean;
  priority?: number;
  filter?: EventFilter;
}

// 内部事件监听器描述符
interface EventListenerDescriptor<T = any> {
  listener: EventListener<T>;
  options: EventListenerOptions;
  id: string;
}

// 事件总线实现
export class EventBus implements IEventEmitter, Disposable {
  private listeners = new Map<string, EventListenerDescriptor[]>();
  private disposed = false;
  private eventId = 0;

  // 添加事件监听器
  on<T = any>(eventType: string, listener: EventListener<T>, options: EventListenerOptions = {}): Disposable {
    if (this.disposed) {
      throw new LuckinError(
        ERROR_CODES.INVALID_ARGUMENT,
        'Cannot add listener to disposed EventBus'
      );
    }

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const descriptor: EventListenerDescriptor<T> = {
      listener,
      options,
      id: `listener_${++this.eventId}`
    };

    const eventListeners = this.listeners.get(eventType)!;
    
    // 根据优先级插入监听器
    const priority = options.priority || 0;
    const insertIndex = eventListeners.findIndex(d => (d.options.priority || 0) < priority);
    
    if (insertIndex === -1) {
      eventListeners.push(descriptor);
    } else {
      eventListeners.splice(insertIndex, 0, descriptor);
    }

    // 返回取消监听的 Disposable
    return {
      dispose: () => {
        this.off(eventType, listener);
      }
    };
  }

  // 移除事件监听器
  off<T = any>(eventType: string, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners) {
      return;
    }

    const index = eventListeners.findIndex(d => d.listener === listener);
    if (index !== -1) {
      eventListeners.splice(index, 1);
      
      // 如果没有监听器了，清理映射
      if (eventListeners.length === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  // 添加一次性事件监听器
  once<T = any>(eventType: string, listener: EventListener<T>): Disposable {
    return this.on(eventType, listener, { once: true });
  }

  // 发射事件
  emit<T = any>(eventType: string, payload?: T): void {
    if (this.disposed) {
      return;
    }

    const event: IEvent<T> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
      source: 'EventBus'
    };

    this.emitEvent(event);
  }

  // 发射事件对象
  emitEvent<T = any>(event: IEvent<T>): void {
    if (this.disposed) {
      return;
    }

    const eventListeners = this.listeners.get(event.type);
    if (!eventListeners || eventListeners.length === 0) {
      return;
    }

    // 创建监听器副本，避免在执行过程中修改数组
    const listenersToCall = [...eventListeners];
    const toRemove: EventListenerDescriptor[] = [];

    for (const descriptor of listenersToCall) {
      try {
        // 应用过滤器
        if (descriptor.options.filter && !descriptor.options.filter(event)) {
          continue;
        }

        // 调用监听器
        descriptor.listener(event);

        // 如果是一次性监听器，标记为移除
        if (descriptor.options.once) {
          toRemove.push(descriptor);
        }
      } catch (error) {
        console.error(`Error in event listener for '${event.type}':`, error);
        
        // 发射错误事件
        try {
          this.emit('error', {
            originalEvent: event,
            error,
            listener: descriptor
          });
        } catch {
          // 忽略错误事件的错误，避免无限递归
        }
      }
    }

    // 移除一次性监听器
    if (toRemove.length > 0) {
      const currentListeners = this.listeners.get(event.type);
      if (currentListeners) {
        for (const descriptorToRemove of toRemove) {
          const index = currentListeners.indexOf(descriptorToRemove);
          if (index !== -1) {
            currentListeners.splice(index, 1);
          }
        }
        
        // 如果没有监听器了，清理映射
        if (currentListeners.length === 0) {
          this.listeners.delete(event.type);
        }
      }
    }
  }

  // 等待事件
  waitFor<T = any>(eventType: string, timeout?: number, filter?: EventFilter<T>): Promise<IEvent<T>> {
    return new Promise((resolve, reject) => {
      let disposed = false;
      let timeoutId: NodeJS.Timeout | undefined;

      const cleanup = () => {
        disposed = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      // 设置超时
      if (timeout && timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new LuckinError(
            ERROR_CODES.TIMEOUT,
            `Event '${eventType}' not received within ${timeout}ms`
          ));
        }, timeout);
      }

      // 添加监听器
      const disposable = this.on(eventType, (event: IEvent<T>) => {
        if (disposed) {
          return;
        }

        cleanup();
        disposable.dispose();
        resolve(event);
      }, {
        once: true,
        filter
      });
    });
  }

  // 获取事件类型列表
  getEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  // 获取指定事件类型的监听器数量
  getListenerCount(eventType: string): number {
    const eventListeners = this.listeners.get(eventType);
    return eventListeners ? eventListeners.length : 0;
  }

  // 检查是否有指定事件类型的监听器
  hasListeners(eventType: string): boolean {
    return this.getListenerCount(eventType) > 0;
  }

  // 移除指定事件类型的所有监听器
  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  // 获取统计信息
  getStats(): {
    eventTypes: number;
    totalListeners: number;
    listenersByType: Record<string, number>;
  } {
    const listenersByType: Record<string, number> = {};
    let totalListeners = 0;

    for (const [eventType, listeners] of this.listeners.entries()) {
      const count = listeners.length;
      listenersByType[eventType] = count;
      totalListeners += count;
    }

    return {
      eventTypes: this.listeners.size,
      totalListeners,
      listenersByType
    };
  }

  // 释放资源
  dispose(): void {
    if (this.disposed) {
      return;
    }

    this.listeners.clear();
    this.disposed = true;
  }

  // 检查是否已释放
  isDisposed(): boolean {
    return this.disposed;
  }
}

// 全局事件总线实例
export const globalEventBus = new EventBus();

// 事件总线工厂
export class EventBusFactory {
  private static instances = new Map<string, EventBus>();

  // 创建或获取命名事件总线
  static create(name: string): EventBus {
    if (!this.instances.has(name)) {
      this.instances.set(name, new EventBus());
    }
    return this.instances.get(name)!;
  }

  // 销毁命名事件总线
  static destroy(name: string): void {
    const instance = this.instances.get(name);
    if (instance) {
      instance.dispose();
      this.instances.delete(name);
    }
  }

  // 销毁所有事件总线
  static destroyAll(): void {
    for (const [_name, instance] of this.instances.entries()) {
      instance.dispose();
    }
    this.instances.clear();
  }

  // 获取所有事件总线名称
  static getNames(): string[] {
    return Array.from(this.instances.keys());
  }
}

// 事件装饰器
export function EventHandler(eventType: string, options?: EventListenerOptions): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    // const _originalMethod = descriptor.value;
    
    // 存储事件处理信息，用于后续自动注册
    if (!target._eventHandlers) {
      target._eventHandlers = [];
    }
    
    target._eventHandlers.push({
      eventType,
      method: propertyKey,
      options
    });
    
    return descriptor;
  };
}

// 自动注册事件处理器的辅助函数
export function registerEventHandlers(instance: any, eventBus: EventBus = globalEventBus): Disposable[] {
  const disposables: Disposable[] = [];
  const eventHandlers = instance._eventHandlers || [];
  
  for (const handler of eventHandlers) {
    const method = instance[handler.method];
    if (typeof method === 'function') {
      const disposable = eventBus.on(
        handler.eventType,
        method.bind(instance),
        handler.options
      );
      disposables.push(disposable);
    }
  }
  
  return disposables;
}