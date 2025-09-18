/**
 * Configuration System - Centralized configuration management
 * @author LGINX AI Corporation
 * @version 3.0.0
 */

import type { 
  IConfiguration, 
  Event, 
  Disposable 
} from '@lgnixai/luckin-foundation';
import { Emitter, LuckinError, ErrorCode } from '@lgnixai/luckin-foundation';

/**
 * Luckin IDE configuration interface
 */
export interface ILuckinConfig {
  // Core settings
  locale?: string;
  theme?: string;
  
  // Editor settings
  editor?: {
    fontSize?: number;
    fontFamily?: string;
    tabSize?: number;
    insertSpaces?: boolean;
    wordWrap?: 'on' | 'off' | 'wordWrapColumn';
    lineNumbers?: 'on' | 'off' | 'relative';
    minimap?: {
      enabled?: boolean;
      side?: 'left' | 'right';
    };
  };
  
  // UI settings
  ui?: {
    sidebarLocation?: 'left' | 'right';
    panelLocation?: 'bottom' | 'right';
    showActivityBar?: boolean;
    showStatusBar?: boolean;
    showMenuBar?: boolean;
  };
  
  // Extension settings
  extensions?: string[];
  
  // Workspace settings
  workspace?: {
    autoSave?: 'off' | 'afterDelay' | 'onFocusChange';
    autoSaveDelay?: number;
  };
  
  // Custom settings
  [key: string]: any;
}

/**
 * Configuration implementation with change tracking
 */
export class Configuration implements IConfiguration {
  private _config = new Map<string, any>();
  private _onDidChange = new Emitter<{ key: string; value: any }>();
  private _disposed = false;

  constructor(initialConfig: ILuckinConfig = {}) {
    this._loadConfig(initialConfig);
  }

  get onDidChange(): Event<{ key: string; value: any }> {
    return this._onDidChange.event;
  }

  get<T>(key: string): T | undefined;
  get<T>(key: string, defaultValue: T): T;
  get<T>(key: string, defaultValue?: T): T | undefined {
    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot get from disposed configuration'
      );
    }

    const value = this._getNestedValue(key);
    return value !== undefined ? value : defaultValue;
  }

  set<T>(key: string, value: T): void {
    if (this._disposed) {
      throw new LuckinError(
        ErrorCode.InvalidArgument,
        'Cannot set on disposed configuration'
      );
    }

    const oldValue = this._getNestedValue(key);
    this._setNestedValue(key, value);

    if (oldValue !== value) {
      this._onDidChange.fire({ key, value });
    }
  }

  has(key: string): boolean {
    return this._getNestedValue(key) !== undefined;
  }

  remove(key: string): void {
    if (this._disposed) {
      return;
    }

    if (this.has(key)) {
      this._removeNestedValue(key);
      this._onDidChange.fire({ key, value: undefined });
    }
  }

  /**
   * Get all configuration as object
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of this._config.entries()) {
      this._setNestedValue(key, value, result);
    }
    
    return result;
  }

  /**
   * Update multiple configuration values
   */
  update(config: Partial<ILuckinConfig>): void {
    const changes: Array<{ key: string; value: any }> = [];
    
    this._flattenConfig(config, '', changes);
    
    for (const change of changes) {
      const oldValue = this._getNestedValue(change.key);
      if (oldValue !== change.value) {
        this._setNestedValue(change.key, change.value);
        this._onDidChange.fire(change);
      }
    }
  }

  /**
   * Reset configuration to defaults
   */
  reset(): void {
    const keys = Array.from(this._config.keys());
    this._config.clear();
    
    for (const key of keys) {
      this._onDidChange.fire({ key, value: undefined });
    }
  }

  dispose(): void {
    if (!this._disposed) {
      this._disposed = true;
      this._config.clear();
      this._onDidChange.dispose();
    }
  }

  private _loadConfig(config: ILuckinConfig): void {
    this._flattenConfig(config, '', []);
  }

  private _flattenConfig(
    obj: any, 
    prefix: string, 
    changes: Array<{ key: string; value: any }>
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this._flattenConfig(value, fullKey, changes);
      } else {
        this._config.set(fullKey, value);
        changes.push({ key: fullKey, value });
      }
    }
  }

  private _getNestedValue(key: string): any {
    return this._config.get(key);
  }

  private _setNestedValue(key: string, value: any, target: Record<string, any> = this._config): void {
    if (target === this._config) {
      this._config.set(key, value);
    } else {
      const parts = key.split('.');
      let current = target;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current) || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
      
      current[parts[parts.length - 1]] = value;
    }
  }

  private _removeNestedValue(key: string): void {
    this._config.delete(key);
  }
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ILuckinConfig = {
  locale: 'en-US',
  theme: 'default-dark',
  
  editor: {
    fontSize: 14,
    fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", monospace',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    lineNumbers: 'on',
    minimap: {
      enabled: true,
      side: 'right'
    }
  },
  
  ui: {
    sidebarLocation: 'left',
    panelLocation: 'bottom',
    showActivityBar: true,
    showStatusBar: true,
    showMenuBar: true
  },
  
  extensions: [],
  
  workspace: {
    autoSave: 'afterDelay',
    autoSaveDelay: 1000
  }
};

/**
 * Global configuration instance
 */
export const globalConfig = new Configuration(DEFAULT_CONFIG);