import type { 
  IPlugin, 
  IPluginManifest, 
  IPluginService, 
  IPluginContext, 
  IEventEmitter
} from '@lgnixai/luckin-types';
import { PluginState } from '@lgnixai/luckin-types';
import { BaseService } from './base/base-service';
import { GreenserverPluginApi, type PluginResponse, type CommandResponse, type InstallationStatusResponse } from './greenserver-plugin-api';

// Simple browser-compatible EventEmitter
class SimpleEventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(...args));
    }
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// 基于Greenserver的插件服务实现
export class GreenserverPluginService extends BaseService implements IPluginService {
  private plugins: Map<string, IPlugin> = new Map();
  private api: GreenserverPluginApi;
  private eventEmitter: SimpleEventEmitter = new SimpleEventEmitter();
  private eventSource: EventSource | null = null;

  constructor(baseUrl?: string, apiKey?: string) {
    super('GreenserverPluginService', 'greenserver-plugin-service');
    this.api = new GreenserverPluginApi(baseUrl, apiKey);
  }

  // 初始化服务
  async initialize(): Promise<void> {
    await super.initialize();
    
    // 加载已安装的插件
    await this.loadInstalledPlugins();
    
    // 订阅服务器事件
    this.subscribeToServerEvents();
  }

  // 加载已安装的插件
  private async loadInstalledPlugins(): Promise<void> {
    try {
      const serverPlugins = await this.api.getInstalledPlugins();
      
      for (const serverPlugin of serverPlugins) {
        const plugin = await this.convertServerPluginToIPlugin(serverPlugin);
        this.plugins.set(plugin.id, plugin);
        
        // 如果插件已启用，设置为活跃状态
        if (serverPlugin.enabled) {
          plugin.state = PluginState.Active;
        }
      }
      
      console.log(`Loaded ${this.plugins.size} plugins from Greenserver`);
    } catch (error) {
      console.error('Failed to load plugins from Greenserver:', error);
    }
  }

  // 订阅服务器事件
  private subscribeToServerEvents(): void {
    try {
      this.eventSource = this.api.subscribeToEvents();
      
      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (error) {
          console.error('Failed to parse server event:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
      };
    } catch (error) {
      console.error('Failed to subscribe to server events:', error);
    }
  }

  // 处理服务器事件
  private handleServerEvent(event: any): void {
    switch (event.type) {
      case 'plugin.enabled':
        this.handlePluginEnabled(event.data.pluginId);
        break;
      case 'plugin.disabled':
        this.handlePluginDisabled(event.data.pluginId);
        break;
      case 'plugin.installed':
        this.handlePluginInstalled(event.data.pluginId);
        break;
      case 'plugin.uninstalled':
        this.handlePluginUninstalled(event.data.pluginId);
        break;
      case 'plugin.installation.progress':
        this.handleInstallationProgress(event.data);
        break;
      case 'command.invoked':
        this.handleCommandInvoked(event.data.pluginId, event.data.commandId);
        break;
    }
  }

  private async handlePluginEnabled(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      const oldState = plugin.state;
      plugin.state = PluginState.Active;
      this.eventEmitter.emit('onDidChangePluginState', { plugin, state: plugin.state });
      this.eventEmitter.emit('onDidActivatePlugin', plugin);
    }
  }

  private async handlePluginDisabled(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      const oldState = plugin.state;
      plugin.state = PluginState.Deactivated;
      this.eventEmitter.emit('onDidChangePluginState', { plugin, state: plugin.state });
      this.eventEmitter.emit('onDidDeactivatePlugin', plugin);
    }
  }

  private async handlePluginInstalled(pluginId: string): Promise<void> {
    // 重新加载插件列表
    await this.loadInstalledPlugins();
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.eventEmitter.emit('onDidInstallPlugin', plugin);
    }
  }

  private async handlePluginUninstalled(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.delete(pluginId);
      this.eventEmitter.emit('onDidUninstallPlugin', plugin);
    }
  }

  private handleInstallationProgress(data: any): void {
    // 可以在这里更新安装进度的UI
    this.eventEmitter.emit('onInstallationProgress', data);
  }

  private handleCommandInvoked(pluginId: string, commandId: string): void {
    this.eventEmitter.emit('onCommandInvoked', { pluginId, commandId });
  }

  // 将服务器插件转换为IPlugin接口
  private async convertServerPluginToIPlugin(serverPlugin: PluginResponse): Promise<IPlugin> {
    const manifest: IPluginManifest = {
      id: serverPlugin.plugin_id,
      name: serverPlugin.name,
      displayName: serverPlugin.name,
      version: serverPlugin.version,
      publisher: serverPlugin.author || 'unknown',
      description: serverPlugin.description || '',
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
      main: serverPlugin.entrypoints?.frontend || '',
      contributes: {
        commands: serverPlugin.commands.map(cmd => ({
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
      enabled: serverPlugin.enabled,
      backupPath: serverPlugin.backup_path,
      permissions: serverPlugin.permissions
    };

    const plugin: IPlugin = {
      id: serverPlugin.plugin_id,
      manifest,
      state: serverPlugin.enabled ? PluginState.Active : PluginState.Loaded,
      activate: async () => {
        await this.api.enablePlugin(serverPlugin.plugin_id);
      },
      deactivate: async () => {
        await this.api.disablePlugin(serverPlugin.plugin_id);
      },
      dispose: () => {
        // 清理逻辑
      },
      onDidChangeState: {
        fire: (state: PluginState) => {
          this.eventEmitter.emit('onDidChangePluginState', { plugin, state });
        },
        event: (listener: (state: PluginState) => void) => {
          this.eventEmitter.on('onDidChangePluginState', (data: { plugin: IPlugin; state: PluginState }) => {
            if (data.plugin.id === plugin.id) {
              listener(data.state);
            }
          });
          return { dispose: () => {} };
        }
      } as any
    };

    return plugin;
  }

  // IPluginService接口实现
  async getInstalledPlugins(): Promise<IPlugin[]> {
    return Array.from(this.plugins.values());
  }

  async getActivePlugins(): Promise<IPlugin[]> {
    return Array.from(this.plugins.values()).filter(plugin => 
      plugin.state === PluginState.Active
    );
  }

  async getPlugin(pluginId: string): Promise<IPlugin | undefined> {
    return this.plugins.get(pluginId);
  }

  async installPlugin(pluginPath: string): Promise<IPlugin> {
    // 解析插件路径获取插件ID和下载URL
    const pluginId = this.extractPluginIdFromUrl(pluginPath);
    
    // 通过市场API获取插件信息
    const marketItems = await this.api.search('');
    const marketItem = marketItems.plugins.find(p => p.id === pluginId);
    
    if (!marketItem) {
      throw new Error(`Plugin ${pluginId} not found in marketplace`);
    }

    // 开始安装
    await this.api.installPlugin(pluginId, (marketItem as any).downloadUrl);
    
    // 等待安装完成
    await this.waitForInstallation(pluginId);
    
    // 重新加载插件
    await this.loadInstalledPlugins();
    
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Failed to install plugin ${pluginId}`);
    }

    return plugin;
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.api.uninstallPlugin(pluginId);
    
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      this.plugins.delete(pluginId);
      this.eventEmitter.emit('onDidUninstallPlugin', plugin);
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    await this.api.enablePlugin(pluginId);
    
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.state = PluginState.Active;
      this.eventEmitter.emit('onDidActivatePlugin', plugin);
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    await this.api.disablePlugin(pluginId);
    
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.state = PluginState.Deactivated;
      this.eventEmitter.emit('onDidDeactivatePlugin', plugin);
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    return this.activatePlugin(pluginId);
  }

  async disablePlugin(pluginId: string): Promise<void> {
    return this.deactivatePlugin(pluginId);
  }

  async reloadPlugin(pluginId: string): Promise<void> {
    await this.deactivatePlugin(pluginId);
    await this.activatePlugin(pluginId);
  }

  // 事件订阅
  get onDidInstallPlugin(): IEventEmitter<IPlugin> {
    return {
      event: (listener: (plugin: IPlugin) => void) => {
        this.eventEmitter.on('onDidInstallPlugin', listener);
        return { dispose: () => this.eventEmitter.off('onDidInstallPlugin', listener) };
      }
    } as any;
  }

  get onDidUninstallPlugin(): IEventEmitter<IPlugin> {
    return {
      event: (listener: (plugin: IPlugin) => void) => {
        this.eventEmitter.on('onDidUninstallPlugin', listener);
        return { dispose: () => this.eventEmitter.off('onDidUninstallPlugin', listener) };
      }
    } as any;
  }

  get onDidActivatePlugin(): IEventEmitter<IPlugin> {
    return {
      event: (listener: (plugin: IPlugin) => void) => {
        this.eventEmitter.on('onDidActivatePlugin', listener);
        return { dispose: () => this.eventEmitter.off('onDidActivatePlugin', listener) };
      }
    } as any;
  }

  get onDidDeactivatePlugin(): IEventEmitter<IPlugin> {
    return {
      event: (listener: (plugin: IPlugin) => void) => {
        this.eventEmitter.on('onDidDeactivatePlugin', listener);
        return { dispose: () => this.eventEmitter.off('onDidDeactivatePlugin', listener) };
      }
    } as any;
  }

  get onDidChangePluginState(): IEventEmitter<{ plugin: IPlugin; state: PluginState }> {
    return {
      event: (listener: (data: { plugin: IPlugin; state: PluginState }) => void) => {
        this.eventEmitter.on('onDidChangePluginState', listener);
        return { dispose: () => this.eventEmitter.off('onDidChangePluginState', listener) };
      }
    } as any;
  }

  // 工具方法
  private extractPluginIdFromUrl(url: string): string {
    // 从URL中提取插件ID的逻辑
    if (url.startsWith('http')) {
      const parts = url.split('/');
      return parts[parts.length - 1].replace(/\.(zip|tar\.gz)$/, '');
    }
    return url;
  }

  private async waitForInstallation(pluginId: string, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const status = await this.api.getInstallationStatus(pluginId);
      
      if (!status) {
        throw new Error(`Installation status not found for plugin ${pluginId}`);
      }
      
      if (status.status === 'installed') {
        return;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Plugin installation failed: ${status.message}`);
      }
      
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Plugin installation timeout for ${pluginId}`);
  }

  // 暴露API（暂时不实现）
  exposeApi(pluginId: string, api: any): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      (plugin as any).exports = api;
    }
  }

  // BaseService abstract method implementations
  protected onInitialize(): void | Promise<void> {
    // 在initialize方法中已处理
  }

  protected onDispose(): void | Promise<void> {
    // 关闭事件源
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // 清理所有插件
    this.plugins.clear();
    this.eventEmitter.removeAllListeners();
  }

  // 清理资源
  dispose(): void {
    super.dispose();
  }

  // Greenserver特有的方法
  async backupPlugin(pluginId: string): Promise<string> {
    return this.api.backupPlugin(pluginId);
  }

  async getCommands(): Promise<CommandResponse[]> {
    return this.api.getCommands();
  }

  async getInstallationStatus(pluginId: string): Promise<InstallationStatusResponse | null> {
    return this.api.getInstallationStatus(pluginId);
  }

  // Vault操作
  async listVaultFiles(pluginId: string): Promise<string[]> {
    return this.api.listVaultFiles(pluginId);
  }

  async readVaultFile(pluginId: string, path: string): Promise<{ path: string; content: string }> {
    return this.api.readVaultFile(pluginId, path);
  }

  async writeVaultFile(pluginId: string, path: string, content: string): Promise<{ ok: boolean }> {
    return this.api.writeVaultFile(pluginId, path, content);
  }

  // 命令操作
  async registerCommand(pluginId: string, commandId: string, title: string): Promise<{ ok: boolean }> {
    return this.api.registerCommand(pluginId, commandId, title);
  }

  async invokeCommand(pluginId: string, commandId: string): Promise<{ ok: boolean }> {
    return this.api.invokeCommand(pluginId, commandId);
  }
}
