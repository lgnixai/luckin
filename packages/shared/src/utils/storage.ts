// 存储工具函数

import type { IConfiguration } from '@lginxai/luckin-types';

// 存储适配器接口
export interface IStorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// 本地存储适配器
export class LocalStorageAdapter implements IStorageAdapter {
  private prefix: string;

  constructor(prefix = 'luckin:') {
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = localStorage.getItem(this.getKey(key));
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(this.getKey(key));
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(key));
  }

  async keys(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}

// IndexedDB存储适配器
export class IndexedDBAdapter implements IStorageAdapter {
  private dbName: string;
  private storeName: string;
  private version: number;
  private db: IDBDatabase | null = null;

  constructor(dbName = 'LuckinDB', storeName = 'storage', version = 1) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.version = version;
  }

  private async openDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], mode);
    return transaction.objectStore(this.storeName);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const store = await this.getStore('readonly');
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async remove(key: string): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clear(): Promise<void> {
    const store = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async keys(): Promise<string[]> {
    const store = await this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async size(): Promise<number> {
    const store = await this.getStore('readonly');
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

// 内存存储适配器（用于测试）
export class MemoryStorageAdapter implements IStorageAdapter {
  private data = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.data.get(key) || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }

  async clear(): Promise<void> {
    this.data.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.data.keys());
  }

  async size(): Promise<number> {
    return this.data.size;
  }
}

// 分层存储管理器
export class StorageManager implements IStorageAdapter {
  private adapters: IStorageAdapter[] = [];

  constructor(...adapters: IStorageAdapter[]) {
    this.adapters = adapters;
  }

  addAdapter(adapter: IStorageAdapter): void {
    this.adapters.push(adapter);
  }

  async get<T>(key: string): Promise<T | null> {
    for (const adapter of this.adapters) {
      try {
        const value = await adapter.get<T>(key);
        if (value !== null) {
          return value;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    const errors: Error[] = [];
    
    for (const adapter of this.adapters) {
      try {
        await adapter.set(key, value);
        return; // 成功保存到第一个可用的适配器
      } catch (error) {
        errors.push(error as Error);
      }
    }
    
    throw new Error(`Failed to save to all adapters: ${errors.map(e => e.message).join(', ')}`);
  }

  async remove(key: string): Promise<void> {
    await Promise.allSettled(
      this.adapters.map(adapter => adapter.remove(key))
    );
  }

  async clear(): Promise<void> {
    await Promise.allSettled(
      this.adapters.map(adapter => adapter.clear())
    );
  }

  async keys(): Promise<string[]> {
    const allKeys = new Set<string>();
    
    for (const adapter of this.adapters) {
      try {
        const keys = await adapter.keys();
        keys.forEach(key => allKeys.add(key));
      } catch {
        continue;
      }
    }
    
    return Array.from(allKeys);
  }

  async size(): Promise<number> {
    const keys = await this.keys();
    return keys.length;
  }
}

// 配置管理器
export class ConfigurationManager implements IConfiguration {
  private storage: IStorageAdapter;
  private cache = new Map<string, any>();
  private prefix: string;

  constructor(storage: IStorageAdapter, prefix = 'config:') {
    this.storage = storage;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string, defaultValue?: T): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    return defaultValue as T;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
    await this.storage.set(this.getKey(key), value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  async remove(key: string): Promise<void> {
    this.cache.delete(key);
    await this.storage.remove(this.getKey(key));
  }

  async load(): Promise<void> {
    try {
      const keys = await this.storage.keys();
      const configKeys = keys.filter(key => key.startsWith(this.prefix));
      
      for (const fullKey of configKeys) {
        const key = fullKey.substring(this.prefix.length);
        const value = await this.storage.get(fullKey);
        if (value !== null) {
          this.cache.set(key, value);
        }
      }
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  }

  async save(): Promise<void> {
    try {
      for (const [key, value] of this.cache.entries()) {
        await this.storage.set(this.getKey(key), value);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.cache.entries()) {
      result[key] = value;
    }
    return result;
  }

  clear(): void {
    this.cache.clear();
  }
}

// 存储工具函数
export const StorageUtils = {
  // 创建默认存储管理器
  createDefaultStorage(): StorageManager {
    const storage = new StorageManager();
    
    // 优先使用 IndexedDB，回退到 localStorage
    if (typeof window !== 'undefined') {
      if ('indexedDB' in window) {
        storage.addAdapter(new IndexedDBAdapter());
      }
      if ('localStorage' in window) {
        storage.addAdapter(new LocalStorageAdapter());
      }
    }
    
    // 最后添加内存存储作为兜底
    storage.addAdapter(new MemoryStorageAdapter());
    
    return storage;
  },

  // 序列化数据
  serialize<T>(data: T): string {
    return JSON.stringify(data, null, 2);
  },

  // 反序列化数据
  deserialize<T>(data: string): T {
    return JSON.parse(data);
  },

  // 计算数据大小（字节）
  getDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  },

  // 压缩数据（简单的 gzip 压缩，需要额外依赖）
  async compress(data: string): Promise<Uint8Array> {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(data));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    }
    
    // 回退到原始数据
    return new TextEncoder().encode(data);
  },

  // 解压数据
  async decompress(data: Uint8Array): Promise<string> {
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(data as BufferSource);
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return new TextDecoder().decode(result);
    }
    
    // 回退到原始数据
    return new TextDecoder().decode(data);
  }
};