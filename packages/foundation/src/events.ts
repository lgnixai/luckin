/**
 * Event System - High-performance event handling for Luckin IDE
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  Disposable, 
  EventListener, 
  Event, 
  EventEmitter, 
  IEventBus 
} from './types';
import { LuckinError, ErrorCode } from './errors';

/**
 * Disposable implementation
 */
class DisposableImpl implements Disposable {
  private _disposed = false;
  
  constructor(private _dispose: () => void) {}

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this._dispose();
    }
  }

  get isDisposed(): boolean {
    return this._disposed;
  }
}

/**
 * Event emitter implementation with optimized performance
 */
export class Emitter<T = any> implements EventEmitter<T> {
  private _listeners: EventListener<T>[] = [];
  private _disposed = false;

  get event(): Event<T> {
    return (listener: EventListener<T>): Disposable => {
      if (this._disposed) {
        throw new LuckinError(
          ErrorCode.InvalidArgument,
          'Cannot add listener to disposed emitter'
        );
      }

      this._listeners.push(listener);

      return new DisposableImpl(() => {
        if (!this._disposed) {
          const index = this._listeners.indexOf(listener);
          if (index !== -1) {
            this._listeners.splice(index, 1);
          }
        }
      });
    };
  }

  fire(data: T): void {
    if (this._disposed) {
      return;
    }

    // Create a snapshot to avoid issues if listeners are modified during firing
    const listeners = this._listeners.slice();
    
    for (const listener of listeners) {
      try {
        listener(data);
      } catch (error) {
        // Don't let listener errors break other listeners
        console.error('Error in event listener:', error);
      }
    }
  }

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this._listeners.length = 0;
    }
  }

  get hasListeners(): boolean {
    return this._listeners.length > 0;
  }

  get listenerCount(): number {
    return this._listeners.length;
  }
}

/**
 * Event bus implementation for global event communication
 */
export class EventBus implements IEventBus {
  private _emitters = new Map<string, Emitter<any>>();
  private _disposed = false;

  on<T = any>(eventType: string, listener: EventListener<T>): Disposable {
    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot add listener to disposed EventBus'
      );
    }

    let emitter = this._emitters.get(eventType);
    if (!emitter) {
      emitter = new Emitter<T>();
      this._emitters.set(eventType, emitter);
    }

    const disposable = emitter.event(listener);

    // Clean up emitter if no more listeners
    return new DisposableImpl(() => {
      disposable.dispose();
      
      if (emitter && !emitter.hasListeners) {
        this._emitters.delete(eventType);
        emitter.dispose();
      }
    });
  }

  off<T = any>(eventType: string, listener: EventListener<T>): void {
    const emitter = this._emitters.get(eventType);
    if (emitter) {
      // This is a simplified implementation
      // In a real scenario, we'd need to track disposables per listener
      console.warn('EventBus.off() is deprecated, use the returned Disposable from on() instead');
    }
  }

  emit<T = any>(eventType: string, data?: T): void {
    if (this._disposed) {
      return;
    }

    const emitter = this._emitters.get(eventType);
    if (emitter) {
      emitter.fire(data);
    }
  }

  once<T = any>(eventType: string, listener: EventListener<T>): Disposable {
    let disposable: Disposable | undefined;
    
    disposable = this.on<T>(eventType, (data: T) => {
      if (disposable) {
        disposable.dispose();
      }
      listener(data);
    });

    return disposable;
  }

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      
      for (const emitter of this._emitters.values()) {
        emitter.dispose();
      }
      
      this._emitters.clear();
    }
  }

  get eventTypes(): string[] {
    return Array.from(this._emitters.keys());
  }

  hasListeners(eventType: string): boolean {
    const emitter = this._emitters.get(eventType);
    return emitter ? emitter.hasListeners : false;
  }

  getListenerCount(eventType: string): number {
    const emitter = this._emitters.get(eventType);
    return emitter ? emitter.listenerCount : 0;
  }
}

/**
 * Relay event from one emitter to another
 */
export function relay<T>(source: Event<T>, target: Emitter<T>): Disposable {
  return source(data => target.fire(data));
}

/**
 * Map events from one type to another
 */
export function mapEvent<T, R>(
  event: Event<T>, 
  mapper: (data: T) => R
): Event<R> {
  return (listener: EventListener<R>) => {
    return event(data => listener(mapper(data)));
  };
}

/**
 * Filter events based on a predicate
 */
export function filterEvent<T>(
  event: Event<T>, 
  predicate: (data: T) => boolean
): Event<T> {
  return (listener: EventListener<T>) => {
    return event(data => {
      if (predicate(data)) {
        listener(data);
      }
    });
  };
}

/**
 * Debounce events
 */
export function debounceEvent<T>(
  event: Event<T>, 
  delay: number
): Event<T> {
  return (listener: EventListener<T>) => {
    let timeout: NodeJS.Timeout | undefined;
    
    return event(data => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        listener(data);
      }, delay);
    });
  };
}

/**
 * Buffer events and emit them in batches
 */
export function bufferEvent<T>(
  event: Event<T>, 
  bufferSize: number
): Event<T[]> {
  return (listener: EventListener<T[]>) => {
    const buffer: T[] = [];
    
    return event(data => {
      buffer.push(data);
      
      if (buffer.length >= bufferSize) {
        listener(buffer.splice(0));
      }
    });
  };
}

/**
 * Global event bus instance
 */
export const globalEventBus = new EventBus();