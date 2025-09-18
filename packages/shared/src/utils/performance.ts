// 性能优化工具函数

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 异步防抖函数
export function asyncDebounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolveList: Array<(value: any) => void> = [];
  let rejectList: Array<(reason?: any) => void> = [];
  
  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      resolveList.push(resolve);
      rejectList.push(reject);
      
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(async () => {
        try {
          const result = await func(...args);
          resolveList.forEach(r => r(result));
        } catch (error) {
          rejectList.forEach(r => r(error));
        } finally {
          resolveList = [];
          rejectList = [];
          timeout = null;
        }
      }, wait);
    });
  };
}

// 记忆化函数
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

// 异步记忆化函数
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = new Map<string, { value: Awaited<ReturnType<T>>; timestamp: number }>();
  
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    const now = Date.now();
    
    if (cache.has(key)) {
      const cached = cache.get(key)!;
      if (!ttl || now - cached.timestamp < ttl) {
        return cached.value;
      }
    }
    
    const result = await func(...args);
    cache.set(key, { value: result, timestamp: now });
    
    return result;
  }) as T;
}

// 批处理函数
export function batchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  options: {
    maxBatchSize?: number;
    delay?: number;
    maxWaitTime?: number;
  } = {}
) {
  const { maxBatchSize = 100, delay = 10, maxWaitTime = 1000 } = options;
  
  let batch: Array<{ item: T; resolve: (value: R) => void; reject: (reason?: any) => void }> = [];
  let timeout: NodeJS.Timeout | null = null;
  let maxWaitTimeout: NodeJS.Timeout | null = null;
  
  const processBatch = async () => {
    if (batch.length === 0) return;
    
    const currentBatch = batch;
    batch = [];
    
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    
    if (maxWaitTimeout) {
      clearTimeout(maxWaitTimeout);
      maxWaitTimeout = null;
    }
    
    try {
      const items = currentBatch.map(b => b.item);
      const results = await processor(items);
      
      currentBatch.forEach((b, index) => {
        b.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach(b => {
        b.reject(error);
      });
    }
  };
  
  return (item: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      batch.push({ item, resolve, reject });
      
      // 如果达到最大批处理大小，立即处理
      if (batch.length >= maxBatchSize) {
        processBatch();
        return;
      }
      
      // 设置延迟处理
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(processBatch, delay);
      
      // 设置最大等待时间
      if (!maxWaitTimeout && batch.length === 1) {
        maxWaitTimeout = setTimeout(processBatch, maxWaitTime);
      }
    });
  };
}

// 并发控制
export class ConcurrencyController {
  private running = 0;
  private queue: Array<() => void> = [];
  
  constructor(private maxConcurrency: number = 5) {}
  
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        this.running++;
        
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      };
      
      if (this.running < this.maxConcurrency) {
        execute();
      } else {
        this.queue.push(execute);
      }
    });
  }
  
  private processQueue() {
    if (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const next = this.queue.shift()!;
      next();
    }
  }
}

// 性能监控
export class PerformanceMonitor {
  private marks = new Map<string, number>();
  private measures = new Map<string, number[]>();
  
  mark(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  measure(name: string, startMark?: string, endMark?: string): number {
    const endTime = endMark ? this.marks.get(endMark) || performance.now() : performance.now();
    const startTime = startMark ? this.marks.get(startMark) || 0 : 0;
    const duration = endTime - startTime;
    
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    return duration;
  }
  
  getStats(name: string): { count: number; total: number; average: number; min: number; max: number } | null {
    const measurements = this.measures.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    const count = measurements.length;
    const total = measurements.reduce((sum, time) => sum + time, 0);
    const average = total / count;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    
    return { count, total, average, min, max };
  }
  
  clear(name?: string): void {
    if (name) {
      this.marks.delete(name);
      this.measures.delete(name);
    } else {
      this.marks.clear();
      this.measures.clear();
    }
  }
}

// 虚拟滚动计算
export class VirtualScrollCalculator {
  constructor(
    private containerHeight: number,
    private itemHeight: number | ((index: number) => number),
    private overscan: number = 5
  ) {}
  
  calculateVisibleRange(scrollTop: number, itemCount: number): { start: number; end: number } {
    if (typeof this.itemHeight === 'number') {
      const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
      const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
      const end = Math.min(itemCount - 1, start + visibleCount + this.overscan * 2);
      
      return { start, end };
    } else {
      // 动态高度的情况下需要累积计算
      let currentTop = 0;
      let start = 0;
      let end = itemCount - 1;
      
      // 找到起始位置
      for (let i = 0; i < itemCount; i++) {
        const height = this.itemHeight(i);
        if (currentTop + height > scrollTop) {
          start = Math.max(0, i - this.overscan);
          break;
        }
        currentTop += height;
      }
      
      // 找到结束位置
      let visibleHeight = 0;
      for (let i = start; i < itemCount; i++) {
        const height = this.itemHeight(i);
        visibleHeight += height;
        if (visibleHeight > this.containerHeight + this.overscan * 2 * height) {
          end = Math.min(itemCount - 1, i + this.overscan);
          break;
        }
      }
      
      return { start, end };
    }
  }
  
  calculateTotalHeight(itemCount: number): number {
    if (typeof this.itemHeight === 'number') {
      return itemCount * this.itemHeight;
    } else {
      let totalHeight = 0;
      for (let i = 0; i < itemCount; i++) {
        totalHeight += this.itemHeight(i);
      }
      return totalHeight;
    }
  }
  
  calculateItemOffset(index: number): number {
    if (typeof this.itemHeight === 'number') {
      return index * this.itemHeight;
    } else {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += this.itemHeight(i);
      }
      return offset;
    }
  }
}

// 资源池
export class ResourcePool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private factory: () => T;
  private resetFn?: (resource: T) => void;
  
  constructor(
    factory: () => T,
    initialSize: number = 0,
    resetFn?: (resource: T) => void
  ) {
    this.factory = factory;
    this.resetFn = resetFn;
    
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }
  
  acquire(): T {
    let resource = this.available.pop();
    
    if (!resource) {
      resource = this.factory();
    }
    
    this.inUse.add(resource);
    return resource;
  }
  
  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource);
      
      if (this.resetFn) {
        this.resetFn(resource);
      }
      
      this.available.push(resource);
    }
  }
  
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
  
  get stats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }
}