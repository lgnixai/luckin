import type { IPluginManifest } from '@lgnixai/luckin-types';
import type { IPluginMarketplaceApi } from './plugin-registry';

// Greenserver插件API接口定义
export interface PluginResponse {
  id: number;
  plugin_id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  enabled: boolean;
  backup_path?: string;
  entrypoints?: {
    frontend?: string;
    backend?: string;
  };
  permissions: string[];
  commands: CommandResponse[];
  created_at: string;
  updated_at: string;
}

export interface CommandResponse {
  id: number;
  command_id: string;
  plugin_id: string;
  title: string;
  description?: string;
}

export interface MarketItem {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  url: string;
  sha256?: string;
  downloads: number;
  rating: number;
}

export interface InstallationStatusResponse {
  plugin_id: string;
  status: 'pending' | 'installing' | 'installed' | 'failed';
  progress: number;
  message: string;
  installed_at?: string;
}

export interface RPCRequest {
  id?: string;
  method: string;
  params?: any;
  pluginId?: string;
}

export interface RPCResponse {
  id?: string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// Greenserver插件市场API实现
export class GreenserverPluginApi implements IPluginMarketplaceApi {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:6066', apiKey?: string) {
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

    const data = await response.json();
    
    // 处理greenserver的响应格式
    if (data.success === false || data.code !== undefined && data.code !== 0) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data.data || data;
  }

  private async rpcRequest<T>(method: string, params?: any, pluginId?: string): Promise<T> {
    const rpcRequest: RPCRequest = {
      id: Math.random().toString(36).substr(2, 9),
      method,
      params,
      pluginId
    };

    const response = await this.request<RPCResponse>('/v1/plugins/rpc', {
      method: 'POST',
      body: JSON.stringify(rpcRequest)
    });

    if (response.error) {
      throw new Error(`RPC Error ${response.error.code}: ${response.error.message}`);
    }

    return response.result;
  }

  // 实现IPluginMarketplaceApi接口
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
    const marketItems = await this.request<MarketItem[]>('/v1/plugins/market');
    
    // 过滤和搜索
    let filteredItems = marketItems;
    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredItems = marketItems.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.author?.toLowerCase().includes(lowerQuery)
      );
    }

    // 排序
    if (options?.sort) {
      filteredItems.sort((a, b) => {
        switch (options.sort) {
          case 'downloads':
            return b.downloads - a.downloads;
          case 'rating':
            return b.rating - a.rating;
          case 'name':
            return a.name.localeCompare(b.name);
          case 'updated':
          default:
            return 0; // 默认排序
        }
      });
    }

    // 分页
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    // 转换为IPluginManifest格式
    const plugins: IPluginManifest[] = paginatedItems.map(item => ({
      id: item.id,
      name: item.name,
      displayName: item.name,
      version: item.version,
      publisher: item.author || 'unknown',
      description: item.description || '',
      categories: ['Other'],
      keywords: [],
      homepage: '',
      repository: '',
      bugs: '',
      license: 'Unknown',
      icon: '',
      galleryBanner: {},
      engines: { luckin: '*' },
      activationEvents: [],
      main: '',
      contributes: {},
      scripts: {},
      devDependencies: {},
      dependencies: {},
      extensionDependencies: [],
      extensionPack: [],
      // 扩展字段
      downloadUrl: item.url,
      downloadCount: item.downloads,
      rating: item.rating,
      sha256: item.sha256
    }));

    return {
      plugins,
      total: filteredItems.length,
      page,
      hasMore: endIndex < filteredItems.length
    };
  }

  async getPlugin(pluginId: string): Promise<IPluginManifest | null> {
    try {
      const plugin = await this.request<PluginResponse>(`/v1/plugins/${pluginId}`);
      
      // 转换为IPluginManifest格式
      return {
        id: plugin.plugin_id,
        name: plugin.name,
        displayName: plugin.name,
        version: plugin.version,
        publisher: plugin.author || 'unknown',
        description: plugin.description || '',
        categories: ['Other'],
        keywords: [],
        homepage: '',
        repository: '',
        bugs: '',
        license: 'Unknown',
        icon: '',
        galleryBanner: {},
        engines: { luckin: '*' },
        activationEvents: [],
        main: plugin.entrypoints?.frontend || '',
        contributes: {
          commands: plugin.commands.map(cmd => ({
            command: cmd.command_id,
            title: cmd.title,
            description: cmd.description
          }))
        },
        scripts: {},
        devDependencies: {},
        dependencies: {},
        extensionDependencies: [],
        extensionPack: [],
        // 扩展字段
        enabled: plugin.enabled,
        backupPath: plugin.backup_path,
        permissions: plugin.permissions
      };
    } catch (error) {
      console.warn(`Failed to get plugin ${pluginId}:`, error);
      return null;
    }
  }

  async getVersions(pluginId: string): Promise<string[]> {
    // Greenserver暂不支持版本管理，返回当前版本
    const plugin = await this.getPlugin(pluginId);
    return plugin ? [plugin.version] : [];
  }

  async getStats(pluginId: string): Promise<{
    downloadCount: number;
    rating: number;
    reviewCount: number;
    lastUpdated: string;
  }> {
    const plugin = await this.request<PluginResponse>(`/v1/plugins/${pluginId}`);
    return {
      downloadCount: 0, // Greenserver暂不支持下载统计
      rating: 0,       // Greenserver暂不支持评分
      reviewCount: 0,  // Greenserver暂不支持评论
      lastUpdated: plugin.updated_at
    };
  }

  async download(pluginId: string, version?: string): Promise<ArrayBuffer> {
    // 通过市场API获取下载链接
    const marketItems = await this.request<MarketItem[]>('/v1/plugins/market');
    const item = marketItems.find(i => i.id === pluginId);
    
    if (!item || !item.url) {
      throw new Error(`Plugin ${pluginId} not found in marketplace`);
    }

    // 下载插件文件
    const response = await fetch(item.url);
    if (!response.ok) {
      throw new Error(`Failed to download plugin: ${response.statusText}`);
    }

    return response.arrayBuffer();
  }

  async getChangelog(pluginId: string, version?: string): Promise<string> {
    // Greenserver暂不支持changelog
    return `# Changelog for ${pluginId}\n\nNo changelog available.`;
  }

  async getReadme(pluginId: string): Promise<string> {
    // Greenserver暂不支持readme
    const plugin = await this.getPlugin(pluginId);
    return `# ${plugin?.displayName || pluginId}\n\n${plugin?.description || 'No description available.'}`;
  }

  async getScreenshots(pluginId: string): Promise<string[]> {
    // Greenserver暂不支持截图
    return [];
  }

  // Greenserver特有的方法
  async getInstalledPlugins(): Promise<PluginResponse[]> {
    return this.request<PluginResponse[]>('/v1/plugins');
  }

  async installPlugin(pluginId: string, url: string, sha256?: string): Promise<void> {
    await this.request('/v1/plugins/install', {
      method: 'POST',
      body: JSON.stringify({
        id: pluginId,
        url,
        sha256
      })
    });
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.request(`/v1/plugins/${pluginId}`, {
      method: 'DELETE'
    });
  }

  async enablePlugin(pluginId: string): Promise<void> {
    await this.request('/v1/plugins/enable', {
      method: 'POST',
      body: JSON.stringify({
        plugin_id: pluginId
      })
    });
  }

  async disablePlugin(pluginId: string): Promise<void> {
    await this.request('/v1/plugins/disable', {
      method: 'POST',
      body: JSON.stringify({
        plugin_id: pluginId
      })
    });
  }

  async backupPlugin(pluginId: string): Promise<string> {
    const response = await this.request<{ backupPath: string }>('/v1/plugins/backup', {
      method: 'POST',
      body: JSON.stringify({
        plugin_id: pluginId
      })
    });
    return response.backupPath;
  }

  async getInstallationStatus(pluginId: string): Promise<InstallationStatusResponse | null> {
    try {
      return await this.request<InstallationStatusResponse>(`/v1/plugins/${pluginId}/installation-status`);
    } catch (error) {
      return null;
    }
  }

  async getCommands(): Promise<CommandResponse[]> {
    return this.request<CommandResponse[]>('/v1/plugins/commands');
  }

  // RPC方法
  async listVaultFiles(pluginId: string): Promise<string[]> {
    return this.rpcRequest<string[]>('vault.list', undefined, pluginId);
  }

  async readVaultFile(pluginId: string, path: string): Promise<{ path: string; content: string }> {
    return this.rpcRequest('vault.read', { path }, pluginId);
  }

  async writeVaultFile(pluginId: string, path: string, content: string): Promise<{ ok: boolean }> {
    return this.rpcRequest('vault.write', { path, content }, pluginId);
  }

  async registerCommand(pluginId: string, commandId: string, title: string): Promise<{ ok: boolean }> {
    return this.rpcRequest('commands.register', { id: commandId, title }, pluginId);
  }

  async invokeCommand(pluginId: string, commandId: string): Promise<{ ok: boolean }> {
    return this.rpcRequest('commands.invoke', { id: commandId }, pluginId);
  }

  // SSE事件流
  subscribeToEvents(): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/v1/plugins/events`);
    return eventSource;
  }
}
