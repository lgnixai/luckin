import type { IPluginManifest } from '@lgnixai/luckin-types';
import type { IPluginStorage } from './plugin-service';

// 浏览器存储实现
export class BrowserPluginStorage implements IPluginStorage {
  private readonly STORAGE_PREFIX = 'luckin-plugin-';
  private readonly METADATA_PREFIX = 'luckin-plugin-meta-';

  async save(pluginId: string, data: ArrayBuffer): Promise<void> {
    try {
      // 将 ArrayBuffer 转换为 base64 字符串存储
      const base64 = this.arrayBufferToBase64(data);
      localStorage.setItem(this.STORAGE_PREFIX + pluginId, base64);
    } catch (error) {
      throw new Error(`Failed to save plugin ${pluginId}: ${error}`);
    }
  }

  async load(pluginId: string): Promise<ArrayBuffer | null> {
    try {
      const base64 = localStorage.getItem(this.STORAGE_PREFIX + pluginId);
      if (!base64) {
        return null;
      }
      return this.base64ToArrayBuffer(base64);
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginId}: ${error}`);
    }
  }

  async delete(pluginId: string): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_PREFIX + pluginId);
      localStorage.removeItem(this.METADATA_PREFIX + pluginId);
    } catch (error) {
      throw new Error(`Failed to delete plugin ${pluginId}: ${error}`);
    }
  }

  async exists(pluginId: string): Promise<boolean> {
    return localStorage.getItem(this.STORAGE_PREFIX + pluginId) !== null;
  }

  async list(): Promise<string[]> {
    const pluginIds: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.STORAGE_PREFIX)) {
        const pluginId = key.substring(this.STORAGE_PREFIX.length);
        pluginIds.push(pluginId);
      }
    }
    
    return pluginIds;
  }

  async getMetadata(pluginId: string): Promise<IPluginManifest | null> {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_PREFIX + pluginId);
      if (!metadataJson) {
        return null;
      }
      return JSON.parse(metadataJson);
    } catch (error) {
      console.warn(`Failed to parse metadata for plugin ${pluginId}:`, error);
      return null;
    }
  }

  async saveMetadata(pluginId: string, manifest: IPluginManifest): Promise<void> {
    try {
      const metadataJson = JSON.stringify(manifest);
      localStorage.setItem(this.METADATA_PREFIX + pluginId, metadataJson);
    } catch (error) {
      throw new Error(`Failed to save metadata for plugin ${pluginId}: ${error}`);
    }
  }

  // 获取存储使用情况
  getStorageUsage(): { used: number; total: number; available: number } {
    let used = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(this.STORAGE_PREFIX) || key.startsWith(this.METADATA_PREFIX))) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }
    
    // 大多数浏览器的 localStorage 限制为 5-10MB
    const total = 10 * 1024 * 1024; // 假设 10MB
    const available = total - used;
    
    return { used, total, available };
  }

  // 清理所有插件数据
  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(this.STORAGE_PREFIX) || key.startsWith(this.METADATA_PREFIX))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// IndexedDB 存储实现（用于更大的存储需求）
export class IndexedDBPluginStorage implements IPluginStorage {
  private dbName = 'LuckinPluginStorage';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建插件数据存储
        if (!db.objectStoreNames.contains('plugins')) {
          db.createObjectStore('plugins', { keyPath: 'id' });
        }
        
        // 创建元数据存储
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  async save(pluginId: string, data: ArrayBuffer): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['plugins'], 'readwrite');
      const store = transaction.objectStore('plugins');
      
      const request = store.put({ id: pluginId, data });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async load(pluginId: string): Promise<ArrayBuffer | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['plugins'], 'readonly');
      const store = transaction.objectStore('plugins');
      
      const request = store.get(pluginId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
    });
  }

  async delete(pluginId: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['plugins', 'metadata'], 'readwrite');
      
      const pluginStore = transaction.objectStore('plugins');
      const metadataStore = transaction.objectStore('metadata');
      
      const deletePlugin = pluginStore.delete(pluginId);
      const deleteMetadata = metadataStore.delete(pluginId);
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  async exists(pluginId: string): Promise<boolean> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['plugins'], 'readonly');
      const store = transaction.objectStore('plugins');
      
      const request = store.count(pluginId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result > 0);
    });
  }

  async list(): Promise<string[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['plugins'], 'readonly');
      const store = transaction.objectStore('plugins');
      
      const request = store.getAllKeys();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  async getMetadata(pluginId: string): Promise<IPluginManifest | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      
      const request = store.get(pluginId);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.manifest : null);
      };
    });
  }

  async saveMetadata(pluginId: string, manifest: IPluginManifest): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      
      const request = store.put({ id: pluginId, manifest });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 获取存储使用情况
  async getStorageUsage(): Promise<{ used: number; total: number; available: number }> {
    if (!navigator.storage || !navigator.storage.estimate) {
      // 回退到估算
      return { used: 0, total: 50 * 1024 * 1024, available: 50 * 1024 * 1024 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 50 * 1024 * 1024; // 默认 50MB
      const available = total - used;
      
      return { used, total, available };
    } catch (error) {
      console.warn('Failed to get storage usage:', error);
      return { used: 0, total: 50 * 1024 * 1024, available: 50 * 1024 * 1024 };
    }
  }

  // 清理所有插件数据
  async clear(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['plugins', 'metadata'], 'readwrite');
      
      const clearPlugins = transaction.objectStore('plugins').clear();
      const clearMetadata = transaction.objectStore('metadata').clear();
      
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

// 内存存储实现（用于测试或临时存储）
export class MemoryPluginStorage implements IPluginStorage {
  private plugins: Map<string, ArrayBuffer> = new Map();
  private metadata: Map<string, IPluginManifest> = new Map();

  async save(pluginId: string, data: ArrayBuffer): Promise<void> {
    this.plugins.set(pluginId, data);
  }

  async load(pluginId: string): Promise<ArrayBuffer | null> {
    return this.plugins.get(pluginId) || null;
  }

  async delete(pluginId: string): Promise<void> {
    this.plugins.delete(pluginId);
    this.metadata.delete(pluginId);
  }

  async exists(pluginId: string): Promise<boolean> {
    return this.plugins.has(pluginId);
  }

  async list(): Promise<string[]> {
    return Array.from(this.plugins.keys());
  }

  async getMetadata(pluginId: string): Promise<IPluginManifest | null> {
    return this.metadata.get(pluginId) || null;
  }

  async saveMetadata(pluginId: string, manifest: IPluginManifest): Promise<void> {
    this.metadata.set(pluginId, manifest);
  }

  // 获取存储使用情况
  getStorageUsage(): { used: number; total: number; available: number } {
    let used = 0;
    
    for (const [key, value] of this.plugins) {
      used += key.length * 2; // 字符串的字节数（假设UTF-16）
      used += value.byteLength;
    }
    
    for (const [key, value] of this.metadata) {
      used += key.length * 2;
      used += JSON.stringify(value).length * 2;
    }
    
    // 内存存储没有硬性限制，但我们可以设置一个合理的限制
    const total = 100 * 1024 * 1024; // 100MB
    const available = total - used;
    
    return { used, total, available };
  }

  // 清理所有插件数据
  clear(): void {
    this.plugins.clear();
    this.metadata.clear();
  }
}

// 存储工厂
export class PluginStorageFactory {
  static createStorage(type: 'browser' | 'indexeddb' | 'memory' = 'browser'): IPluginStorage {
    switch (type) {
      case 'indexeddb':
        return new IndexedDBPluginStorage();
      case 'memory':
        return new MemoryPluginStorage();
      case 'browser':
      default:
        return new BrowserPluginStorage();
    }
  }

  static async getBestStorage(): Promise<IPluginStorage> {
    // 检查 IndexedDB 支持
    if (typeof indexedDB !== 'undefined') {
      try {
        // 测试 IndexedDB 是否可用
        const testDB = indexedDB.open('test-db');
        await new Promise((resolve, reject) => {
          testDB.onsuccess = resolve;
          testDB.onerror = reject;
          testDB.onblocked = reject;
          setTimeout(reject, 1000); // 1秒超时
        });
        testDB.result?.close();
        indexedDB.deleteDatabase('test-db');
        
        return new IndexedDBPluginStorage();
      } catch (error) {
        console.warn('IndexedDB not available, falling back to localStorage:', error);
      }
    }

    // 检查 localStorage 支持
    if (typeof localStorage !== 'undefined') {
      try {
        const testKey = 'test-storage';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        
        return new BrowserPluginStorage();
      } catch (error) {
        console.warn('localStorage not available, falling back to memory:', error);
      }
    }

    // 最后回退到内存存储
    return new MemoryPluginStorage();
  }
}