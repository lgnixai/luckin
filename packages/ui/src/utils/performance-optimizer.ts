/**
 * Performance optimization utilities for the Obsidian Editor
 */

import { Tab, EditorPane } from "@/types/obsidian-editor';

// Virtual scrolling configuration
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number; // Number of items to render outside visible area
}

// Tab virtualization manager
export class TabVirtualizer {
  private config: VirtualScrollConfig;
  private scrollTop: number = 0;
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };

  constructor(config: VirtualScrollConfig) {
    this.config = config;
  }

  updateScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
    this.calculateVisibleRange();
  }

  private calculateVisibleRange() {
    const { itemHeight, containerHeight, overscan } = this.config;
    const visibleStart = Math.floor(this.scrollTop / itemHeight);
    const visibleEnd = Math.ceil((this.scrollTop + containerHeight) / itemHeight);
    
    this.visibleRange = {
      start: Math.max(0, visibleStart - overscan),
      end: visibleEnd + overscan
    };
  }

  getVisibleRange() {
    return this.visibleRange;
  }

  getItemStyle(index: number): React.CSSProperties {
    return {
      position: 'absolute',
      top: index * this.config.itemHeight,
      height: this.config.itemHeight,
      width: '100%'
    };
  }

  getTotalHeight(itemCount: number): number {
    return itemCount * this.config.itemHeight;
  }

  isItemVisible(index: number): boolean {
    return index >= this.visibleRange.start && index <= this.visibleRange.end;
  }
}

// Memory management utilities
export class MemoryManager {
  private static instance: MemoryManager;
  private tabContentCache = new Map<string, { content: string; lastAccessed: number; size: number }>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // Cache tab content with LRU eviction
  cacheTabContent(tabId: string, content: string) {
    const size = new Blob([content]).size;
    
    // Remove existing entry if it exists
    if (this.tabContentCache.has(tabId)) {
      const existing = this.tabContentCache.get(tabId)!;
      this.currentCacheSize -= existing.size;
    }

    // Check if we need to evict items
    while (this.currentCacheSize + size > this.maxCacheSize && this.tabContentCache.size > 0) {
      this.evictLeastRecentlyUsed();
    }

    // Add new entry
    this.tabContentCache.set(tabId, {
      content,
      lastAccessed: Date.now(),
      size
    });
    this.currentCacheSize += size;
  }

  getCachedTabContent(tabId: string): string | null {
    const cached = this.tabContentCache.get(tabId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.content;
    }
    return null;
  }

  private evictLeastRecentlyUsed() {
    let oldestTabId: string | null = null;
    let oldestTime = Date.now();

    for (const [tabId, data] of this.tabContentCache.entries()) {
      if (data.lastAccessed < oldestTime) {
        oldestTime = data.lastAccessed;
        oldestTabId = tabId;
      }
    }

    if (oldestTabId) {
      const data = this.tabContentCache.get(oldestTabId)!;
      this.currentCacheSize -= data.size;
      this.tabContentCache.delete(oldestTabId);
    }
  }

  clearCache() {
    this.tabContentCache.clear();
    this.currentCacheSize = 0;
  }

  getCacheStats() {
    return {
      size: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      itemCount: this.tabContentCache.size,
      utilization: (this.currentCacheSize / this.maxCacheSize) * 100
    };
  }

  // Force garbage collection (if available)
  forceGarbageCollection() {
    if ('gc' in window && typeof window.gc === 'function') {
      window.gc();
    }
  }
}

// Chunk loading for large files
export class ChunkLoader {
  private static readonly CHUNK_SIZE = 1024 * 1024; // 1MB chunks
  private chunks = new Map<string, Map<number, string>>();
  private loadingChunks = new Set<string>();

  async loadChunk(tabId: string, chunkIndex: number, content: string): Promise<string> {
    const chunkKey = `${tabId}-${chunkIndex}`;
    
    if (this.loadingChunks.has(chunkKey)) {
      // Wait for existing load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!this.loadingChunks.has(chunkKey)) {
            clearInterval(checkInterval);
            resolve(this.getChunk(tabId, chunkIndex) || '');
          }
        }, 10);
      });
    }

    this.loadingChunks.add(chunkKey);

    try {
      // Simulate async chunk loading
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const startIndex = chunkIndex * ChunkLoader.CHUNK_SIZE;
      const endIndex = Math.min(startIndex + ChunkLoader.CHUNK_SIZE, content.length);
      const chunk = content.slice(startIndex, endIndex);

      if (!this.chunks.has(tabId)) {
        this.chunks.set(tabId, new Map());
      }
      
      this.chunks.get(tabId)!.set(chunkIndex, chunk);
      return chunk;
    } finally {
      this.loadingChunks.delete(chunkKey);
    }
  }

  getChunk(tabId: string, chunkIndex: number): string | null {
    return this.chunks.get(tabId)?.get(chunkIndex) || null;
  }

  getVisibleContent(tabId: string, startLine: number, endLine: number, content: string): string {
    // For large files, only return visible content
    if (content.length < ChunkLoader.CHUNK_SIZE) {
      return content;
    }

    const lines = content.split('\n');
    const visibleLines = lines.slice(startLine, endLine + 1);
    return visibleLines.join('\n');
  }

  clearChunks(tabId: string) {
    this.chunks.delete(tabId);
  }

  getTotalChunks(contentLength: number): number {
    return Math.ceil(contentLength / ChunkLoader.CHUNK_SIZE);
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics = new Map<string, number[]>();
  private observers = new Map<string, PerformanceObserver>();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(name: string) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(measure.duration);
    }
  }

  getAverageTime(name: string): number {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics() {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    for (const [name, times] of this.metrics.entries()) {
      result[name] = {
        average: this.getAverageTime(name),
        count: times.length,
        latest: times[times.length - 1] || 0
      };
    }
    
    return result;
  }

  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`Long task detected: ${entry.duration}ms`);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.set('longtask', observer);
      } catch (e) {
        // Long task API not supported
      }
    }
  }

  observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).value > 0.1) { // CLS threshold
            console.warn(`Layout shift detected: ${(entry as any).value}`);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('layout-shift', observer);
      } catch (e) {
        // Layout shift API not supported
      }
    }
  }

  disconnect() {
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}

// Debounced operations
export function createDebouncedOperation<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };
  
  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFn;
}

// Throttled operations
export function createThrottledOperation<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return fn(...args);
    }
  }) as T;
}

// Export singleton instances
export const memoryManager = MemoryManager.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
export const chunkLoader = new ChunkLoader();