import type { IPluginManifest } from '@lgnixai/luckin-types';
import { ThemeType } from '@lgnixai/luckin-types';
import type { IPluginRegistry } from './plugin-service';

// 插件市场API接口
export interface IPluginMarketplaceApi {
  search(query: string, options?: {
    category?: string;
    sort?: 'downloads' | 'rating' | 'updated' | 'name';
    page?: number;
    limit?: number;
  }): Promise<{
    plugins: IPluginManifest[];
    total: number;
    page: number;
    hasMore: boolean;
  }>;
  
  getPlugin(pluginId: string): Promise<IPluginManifest | null>;
  getVersions(pluginId: string): Promise<string[]>;
  getStats(pluginId: string): Promise<{
    downloadCount: number;
    rating: number;
    reviewCount: number;
    lastUpdated: string;
  }>;
  
  download(pluginId: string, version?: string): Promise<ArrayBuffer>;
  getChangelog(pluginId: string, version?: string): Promise<string>;
  getReadme(pluginId: string): Promise<string>;
  getScreenshots(pluginId: string): Promise<string[]>;
}

// 默认的插件注册表实现
export class DefaultPluginRegistry implements IPluginRegistry {
  private marketplaceApi: IPluginMarketplaceApi | null = null;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  constructor(marketplaceApi?: IPluginMarketplaceApi) {
    this.marketplaceApi = marketplaceApi || null;
  }

  setMarketplaceApi(api: IPluginMarketplaceApi): void {
    this.marketplaceApi = api;
  }

  async search(query: string, category?: string): Promise<IPluginManifest[]> {
    if (!this.marketplaceApi) {
      return this.getOfflinePlugins(query, category);
    }

    const cacheKey = `search:${query}:${category || ''}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.marketplaceApi.search(query, { category });
      this.setCache(cacheKey, result.plugins);
      return result.plugins;
    } catch (error) {
      console.warn('Failed to search marketplace, falling back to offline:', error);
      return this.getOfflinePlugins(query, category);
    }
  }

  async getManifest(pluginId: string): Promise<IPluginManifest | null> {
    if (!this.marketplaceApi) {
      return this.getOfflineManifest(pluginId);
    }

    const cacheKey = `manifest:${pluginId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const manifest = await this.marketplaceApi.getPlugin(pluginId);
      if (manifest) {
        this.setCache(cacheKey, manifest);
      }
      return manifest;
    } catch (error) {
      console.warn(`Failed to get manifest for ${pluginId}, falling back to offline:`, error);
      return this.getOfflineManifest(pluginId);
    }
  }

  async download(pluginId: string, version?: string): Promise<ArrayBuffer> {
    if (!this.marketplaceApi) {
      throw new Error('Marketplace API not available for download');
    }

    try {
      return await this.marketplaceApi.download(pluginId, version);
    } catch (error) {
      throw new Error(`Failed to download plugin ${pluginId}: ${error}`);
    }
  }

  async getVersions(pluginId: string): Promise<string[]> {
    if (!this.marketplaceApi) {
      const manifest = await this.getOfflineManifest(pluginId);
      return manifest ? [manifest.version] : [];
    }

    const cacheKey = `versions:${pluginId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const versions = await this.marketplaceApi.getVersions(pluginId);
      this.setCache(cacheKey, versions);
      return versions;
    } catch (error) {
      console.warn(`Failed to get versions for ${pluginId}:`, error);
      return [];
    }
  }

  async getStats(pluginId: string): Promise<{
    downloadCount: number;
    rating: number;
    reviewCount: number;
  }> {
    if (!this.marketplaceApi) {
      return { downloadCount: 0, rating: 0, reviewCount: 0 };
    }

    const cacheKey = `stats:${pluginId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const stats = await this.marketplaceApi.getStats(pluginId);
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.warn(`Failed to get stats for ${pluginId}:`, error);
      return { downloadCount: 0, rating: 0, reviewCount: 0 };
    }
  }

  // 额外的方法用于获取更多插件信息
  async getChangelog(pluginId: string, version?: string): Promise<string> {
    if (!this.marketplaceApi) {
      return '';
    }

    try {
      return await this.marketplaceApi.getChangelog(pluginId, version);
    } catch (error) {
      console.warn(`Failed to get changelog for ${pluginId}:`, error);
      return '';
    }
  }

  async getReadme(pluginId: string): Promise<string> {
    if (!this.marketplaceApi) {
      return '';
    }

    try {
      return await this.marketplaceApi.getReadme(pluginId);
    } catch (error) {
      console.warn(`Failed to get readme for ${pluginId}:`, error);
      return '';
    }
  }

  async getScreenshots(pluginId: string): Promise<string[]> {
    if (!this.marketplaceApi) {
      return [];
    }

    try {
      return await this.marketplaceApi.getScreenshots(pluginId);
    } catch (error) {
      console.warn(`Failed to get screenshots for ${pluginId}:`, error);
      return [];
    }
  }

  // 缓存管理
  private getFromCache(key: string): any {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.cacheTimeout) {
      return item.data;
    }
    if (item) {
      this.cache.delete(key);
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCache(): void {
    this.cache.clear();
  }

  // 离线模式的插件数据（用于演示）
  private getOfflinePlugins(query?: string, category?: string): IPluginManifest[] {
    const offlinePlugins: IPluginManifest[] = [
      {
        id: 'markdown-preview',
        name: 'Markdown Preview Enhanced',
        displayName: 'Markdown Preview Enhanced',
        version: '0.6.8',
        description: 'Markdown Preview Enhanced ported to Luckin',
        author: 'shd101wyy',
        publisher: 'shd101wyy',
        engines: { luckin: '^1.74.0' },
        categories: ['Other'],
        keywords: ['markdown', 'preview', 'github'],
        activationEvents: ['onLanguage:markdown'],
        main: './out/extension.js',
        contributes: {
          commands: [
            {
              command: 'markdown-preview-enhanced.openPreview',
              title: 'Open Preview',
              category: 'Markdown'
            }
          ],
          menus: [{
            commandPalette: [{
              command: 'markdown-preview-enhanced.openPreview',
              when: 'editorLangId == markdown'
            }]
          }]
        }
      },
      {
        id: 'theme-dracula',
        name: 'Dracula Official',
        displayName: 'Dracula Official',
        version: '2.24.2',
        description: 'Official Dracula Theme. A dark theme for many editors, shells, and more.',
        author: 'dracula-theme',
        publisher: 'dracula-theme',
        engines: { luckin: '^1.0.0' },
        categories: ['Themes'],
        keywords: ['theme', 'dark', 'dracula'],
        contributes: {
          themes: [{
            id: 'dracula',
            label: 'Dracula',
            uiTheme: ThemeType.Dark,
            path: './themes/dracula.json'
          }]
        }
      },
      {
        id: 'git-lens',
        name: 'GitLens — Git supercharged',
        displayName: 'GitLens — Git supercharged',
        version: '14.7.0',
        description: 'Supercharge Git within Luckin — Visualize code authorship at a glance via Git blame annotations',
        author: 'Eric Amodio',
        publisher: 'eamodio',
        engines: { luckin: '^1.74.0' },
        categories: ['Other'],
        keywords: ['git', 'lens', 'blame', 'history'],
        activationEvents: ['*'],
        main: './out/extension.js',
        contributes: {
          commands: [
            {
              command: 'gitlens.showQuickRepoStatus',
              title: 'Show Repository Status',
              category: 'GitLens'
            }
          ]
        }
      },
      {
        id: 'prettier-vscode',
        name: 'Prettier - Code formatter',
        displayName: 'Prettier - Code formatter',
        version: '10.1.0',
        description: 'Code formatter using prettier',
        author: 'Prettier',
        publisher: 'esbenp',
        engines: { luckin: '^1.74.0' },
        categories: ['Formatters'],
        keywords: ['prettier', 'formatter', 'javascript', 'typescript'],
        activationEvents: ['onStartupFinished'],
        main: './out/extension.js',
        contributes: {
          commands: [
            {
              command: 'prettier.forceFormatDocument',
              title: 'Format Document',
              category: 'Prettier'
            }
          ]
        }
      },
      {
        id: 'luckin-icons',
        name: 'Luckin Icons',
        displayName: 'Luckin Icons',
        version: '1.0.0',
        description: 'File icons for Luckin',
        author: 'Luckin Team',
        publisher: 'luckin',
        engines: { luckin: '^1.0.0' },
        categories: ['Themes'],
        keywords: ['icons', 'file-icons', 'theme'],
        contributes: {
          iconThemes: [{
            id: 'luckin-icons',
            label: 'Luckin Icons',
            path: './icons/luckin-icons.json'
          }]
        }
      }
    ];

    return offlinePlugins.filter(plugin => {
      const matchesQuery = !query || 
        plugin.name.toLowerCase().includes(query.toLowerCase()) ||
        plugin.description?.toLowerCase().includes(query.toLowerCase()) ||
        plugin.keywords?.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()));
      
      const matchesCategory = !category || 
        plugin.categories?.some(cat => cat.toLowerCase() === category.toLowerCase());
      
      return matchesQuery && matchesCategory;
    });
  }

  private getOfflineManifest(pluginId: string): IPluginManifest | null {
    const plugins = this.getOfflinePlugins();
    return plugins.find(plugin => plugin.id === pluginId) || null;
  }
}

// HTTP客户端实现的插件市场API
export class HttpPluginMarketplaceApi implements IPluginMarketplaceApi {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // 移除尾部斜杠
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options?.headers);
    
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async search(query: string, options?: {
    category?: string;
    sort?: 'downloads' | 'rating' | 'updated' | 'name';
    page?: number;
    limit?: number;
  }): Promise<{
    plugins: IPluginManifest[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (options?.category) params.set('category', options.category);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());

    return this.request(`/plugins/search?${params.toString()}`);
  }

  async getPlugin(pluginId: string): Promise<IPluginManifest | null> {
    try {
      return await this.request(`/plugins/${pluginId}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getVersions(pluginId: string): Promise<string[]> {
    const response = await this.request<{ versions: string[] }>(`/plugins/${pluginId}/versions`);
    return response.versions;
  }

  async getStats(pluginId: string): Promise<{
    downloadCount: number;
    rating: number;
    reviewCount: number;
    lastUpdated: string;
  }> {
    return this.request(`/plugins/${pluginId}/stats`);
  }

  async download(pluginId: string, version?: string): Promise<ArrayBuffer> {
    const endpoint = version 
      ? `/plugins/${pluginId}/download/${version}`
      : `/plugins/${pluginId}/download`;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async getChangelog(pluginId: string, version?: string): Promise<string> {
    const endpoint = version 
      ? `/plugins/${pluginId}/changelog/${version}`
      : `/plugins/${pluginId}/changelog`;
    
    const response = await this.request<{ changelog: string }>(endpoint);
    return response.changelog;
  }

  async getReadme(pluginId: string): Promise<string> {
    const response = await this.request<{ readme: string }>(`/plugins/${pluginId}/readme`);
    return response.readme;
  }

  async getScreenshots(pluginId: string): Promise<string[]> {
    const response = await this.request<{ screenshots: string[] }>(`/plugins/${pluginId}/screenshots`);
    return response.screenshots;
  }
}