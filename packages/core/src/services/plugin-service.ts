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
import type { 
  IPlugin, 
  IPluginManifest, 
  IPluginService, 
  IPluginContext, 
  IEventEmitter
} from '@lgnixai/luckin-types';
import { PluginState } from '@lgnixai/luckin-types';
import { BaseService } from './base/base-service';

// 插件注册表接口
export interface IPluginRegistry {
  search(query: string, category?: string): Promise<IPluginManifest[]>;
  getManifest(pluginId: string): Promise<IPluginManifest | null>;
  download(pluginId: string, version?: string): Promise<ArrayBuffer>;
  getVersions(pluginId: string): Promise<string[]>;
  getStats(pluginId: string): Promise<{
    downloadCount: number;
    rating: number;
    reviewCount: number;
  }>;
}

// 本地插件存储接口
export interface IPluginStorage {
  save(pluginId: string, data: ArrayBuffer): Promise<void>;
  load(pluginId: string): Promise<ArrayBuffer | null>;
  delete(pluginId: string): Promise<void>;
  exists(pluginId: string): Promise<boolean>;
  list(): Promise<string[]>;
  getMetadata(pluginId: string): Promise<IPluginManifest | null>;
  saveMetadata(pluginId: string, manifest: IPluginManifest): Promise<void>;
}

// 插件依赖解析器
export class PluginDependencyResolver {
  private plugins: Map<string, IPlugin> = new Map();

  constructor(plugins: Map<string, IPlugin>) {
    this.plugins = plugins;
  }

  // 解析插件依赖
  async resolveDependencies(pluginId: string): Promise<string[]> {
    const visited = new Set<string>();
    const resolved: string[] = [];
    
    await this.resolveDependenciesRecursive(pluginId, visited, resolved);
    
    return resolved;
  }

  private async resolveDependenciesRecursive(
    pluginId: string, 
    visited: Set<string>, 
    resolved: string[]
  ): Promise<void> {
    if (visited.has(pluginId)) {
      throw new Error(`Circular dependency detected: ${pluginId}`);
    }
    
    visited.add(pluginId);
    
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const dependencies = plugin.manifest.extensionDependencies || [];
    
    for (const depId of dependencies) {
      if (!resolved.includes(depId)) {
        await this.resolveDependenciesRecursive(depId, visited, resolved);
      }
    }
    
    if (!resolved.includes(pluginId)) {
      resolved.push(pluginId);
    }
    
    visited.delete(pluginId);
  }

  // 获取依赖此插件的插件列表
  getDependents(pluginId: string): string[] {
    const dependents: string[] = [];
    
    for (const [id, plugin] of this.plugins) {
      const dependencies = plugin.manifest.extensionDependencies || [];
      if (dependencies.includes(pluginId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }

  // 检查是否可以安全卸载插件
  canUninstall(pluginId: string): { canUninstall: boolean; dependents: string[] } {
    const dependents = this.getDependents(pluginId);
    const activeDependents = dependents.filter(id => {
      const plugin = this.plugins.get(id);
      return plugin && plugin.state === PluginState.Active;
    });
    
    return {
      canUninstall: activeDependents.length === 0,
      dependents: activeDependents
    };
  }
}

// 插件生命周期管理器
export class PluginLifecycleManager {
  private plugins: Map<string, IPlugin> = new Map();
  private eventEmitter: SimpleEventEmitter = new SimpleEventEmitter();

  constructor(plugins: Map<string, IPlugin>) {
    this.plugins = plugins;
  }

  // 激活插件
  async activatePlugin(pluginId: string, context: IPluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.state === PluginState.Active) {
      return; // Already active
    }

    try {
      this.setPluginState(plugin, PluginState.Activating);
      
      // 检查激活事件
      const activationEvents = plugin.manifest.activationEvents || [];
      const shouldActivate = activationEvents.length === 0 || 
        activationEvents.some(event => this.shouldActivateForEvent(event));
      
      if (!shouldActivate) {
        this.setPluginState(plugin, PluginState.Loaded);
        return;
      }

      // 调用插件的激活函数
      if (plugin.activate) {
        await plugin.activate(context);
      }

      this.setPluginState(plugin, PluginState.Active);
      this.eventEmitter.emit('pluginActivated', plugin);
    } catch (error) {
      this.setPluginState(plugin, PluginState.Failed);
      this.eventEmitter.emit('pluginActivationFailed', plugin, error);
      throw error;
    }
  }

  // 停用插件
  async deactivatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.state !== PluginState.Active) {
      return; // Not active
    }

    try {
      this.setPluginState(plugin, PluginState.Deactivating);

      // 调用插件的停用函数
      if (plugin.deactivate) {
        await plugin.deactivate();
      }

      this.setPluginState(plugin, PluginState.Loaded);
      this.eventEmitter.emit('pluginDeactivated', plugin);
    } catch (error) {
      this.setPluginState(plugin, PluginState.Failed);
      this.eventEmitter.emit('pluginDeactivationFailed', plugin, error);
      throw error;
    }
  }

  private setPluginState(plugin: IPlugin, state: PluginState): void {
    const oldState = plugin.state;
    (plugin as any).state = state;
    
    // 触发状态变化事件
    // Note: plugin.onDidChangeState is implemented as an event emitter, not directly fireable
    
    this.eventEmitter.emit('pluginStateChanged', plugin, oldState, state);
  }

  private shouldActivateForEvent(event: string): boolean {
    // 简化的激活事件检查逻辑
    // 在实际实现中，这里应该根据具体的激活事件进行判断
    return event === '*' || event === 'onStartupFinished';
  }

  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
}

// 插件安全管理器
export class PluginSecurityManager {
  private trustedPublishers: Set<string> = new Set(['official', 'luckin']);
  private blockedPlugins: Set<string> = new Set();

  // 验证插件安全性
  async validatePlugin(manifest: IPluginManifest): Promise<{
    isValid: boolean;
    issues: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const issues: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // 检查是否被阻止
    if (this.blockedPlugins.has(manifest.id)) {
      issues.push('Plugin is blocked');
      riskLevel = 'high';
    }

    // 检查发布者
    if (!this.trustedPublishers.has(manifest.publisher || '')) {
      issues.push('Publisher is not trusted');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // 检查权限请求
    if (manifest.enabledApiProposals && manifest.enabledApiProposals.length > 0) {
      issues.push('Plugin requests experimental API access');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    // 检查网络访问
    if (manifest.activationEvents?.some(event => event.includes('http'))) {
      issues.push('Plugin may access network resources');
      if (riskLevel === 'low') riskLevel = 'medium';
    }

    return {
      isValid: issues.length === 0 || riskLevel !== 'high',
      issues,
      riskLevel
    };
  }

  // 添加信任的发布者
  addTrustedPublisher(publisher: string): void {
    this.trustedPublishers.add(publisher);
  }

  // 阻止插件
  blockPlugin(pluginId: string): void {
    this.blockedPlugins.add(pluginId);
  }

  // 解除阻止插件
  unblockPlugin(pluginId: string): void {
    this.blockedPlugins.delete(pluginId);
  }
}

// 主要的插件服务实现
export class PluginService extends BaseService implements IPluginService {
  private plugins: Map<string, IPlugin> = new Map();
  private registry: IPluginRegistry | null = null;
  private storage: IPluginStorage | null = null;
  private dependencyResolver: PluginDependencyResolver;
  private lifecycleManager: PluginLifecycleManager;
  private securityManager: PluginSecurityManager;
  private eventEmitter: SimpleEventEmitter = new SimpleEventEmitter();

  constructor() {
    super('PluginService', 'plugin-service');
    this.dependencyResolver = new PluginDependencyResolver(this.plugins);
    this.lifecycleManager = new PluginLifecycleManager(this.plugins);
    this.securityManager = new PluginSecurityManager();

    // 监听生命周期事件
    this.lifecycleManager.on('pluginActivated', (plugin: IPlugin) => {
      this.eventEmitter.emit('onDidActivatePlugin', plugin);
    });

    this.lifecycleManager.on('pluginDeactivated', (plugin: IPlugin) => {
      this.eventEmitter.emit('onDidDeactivatePlugin', plugin);
    });

    this.lifecycleManager.on('pluginStateChanged', (plugin: IPlugin, oldState: PluginState, newState: PluginState) => {
      this.eventEmitter.emit('onDidChangePluginState', { plugin, state: newState });
    });
  }

  // 设置插件注册表
  setRegistry(registry: IPluginRegistry): void {
    this.registry = registry;
  }

  // 设置插件存储
  setStorage(storage: IPluginStorage): void {
    this.storage = storage;
  }

  // 事件发射器实现
  get onDidInstallPlugin(): IEventEmitter<IPlugin> {
    return {
      event: (listener: (plugin: IPlugin) => void) => {
        this.eventEmitter.on('onDidInstallPlugin', listener);
        return { dispose: () => this.eventEmitter.off('onDidInstallPlugin', listener) };
      }
    } as any;
  }

  get onDidUninstallPlugin(): IEventEmitter<string> {
    return {
      event: (listener: (pluginId: string) => void) => {
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

  // 插件安装
  async installPlugin(pluginPath: string): Promise<IPlugin> {
    if (!this.storage) {
      throw new Error('Plugin storage not configured');
    }

    let manifest: IPluginManifest;
    let pluginData: ArrayBuffer;

    if (pluginPath.startsWith('http')) {
      // 从注册表下载
      if (!this.registry) {
        throw new Error('Plugin registry not configured');
      }

      const pluginId = this.extractPluginIdFromUrl(pluginPath);
      const fetchedManifest = await this.registry.getManifest(pluginId);
      if (!fetchedManifest) {
        throw new Error(`Plugin manifest not found: ${pluginId}`);
      }
      manifest = fetchedManifest;

      pluginData = await this.registry.download(pluginId);
    } else {
      // 从本地文件安装
      pluginData = await this.loadLocalPlugin(pluginPath);
      manifest = await this.extractManifestFromPlugin(pluginData);
    }

    // 安全验证
    const validation = await this.securityManager.validatePlugin(manifest);
    if (!validation.isValid) {
      throw new Error(`Plugin validation failed: ${validation.issues.join(', ')}`);
    }

    // 检查依赖
    if (manifest.extensionDependencies) {
      for (const depId of manifest.extensionDependencies) {
        if (!this.plugins.has(depId)) {
          throw new Error(`Missing dependency: ${depId}`);
        }
      }
    }

    // 保存插件
    await this.storage.save(manifest.id, pluginData);
    await this.storage.saveMetadata(manifest.id, manifest);

    // 创建插件实例
    const plugin = await this.createPluginInstance(manifest, pluginData);
    this.plugins.set(manifest.id, plugin);

    // 触发安装事件
    this.eventEmitter.emit('onDidInstallPlugin', plugin);

    return plugin;
  }

  // 插件卸载
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    // 检查依赖关系
    const { canUninstall, dependents } = this.dependencyResolver.canUninstall(pluginId);
    if (!canUninstall) {
      throw new Error(`Cannot uninstall plugin. It is required by: ${dependents.join(', ')}`);
    }

    // 停用插件
    if (plugin.state === PluginState.Active) {
      await this.deactivatePlugin(pluginId);
    }

    // 清理插件资源
    if (plugin.dispose) {
      plugin.dispose();
    }

    // 从存储中删除
    if (this.storage) {
      await this.storage.delete(pluginId);
    }

    // 从内存中移除
    this.plugins.delete(pluginId);

    // 触发卸载事件
    this.eventEmitter.emit('onDidUninstallPlugin', pluginId);
  }

  // 启用插件
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (plugin.state === PluginState.Active) {
      return; // Already enabled
    }

    // 创建插件上下文
    const context = this.createPluginContext(plugin);
    await this.lifecycleManager.activatePlugin(pluginId, context);
  }

  // 禁用插件
  async disablePlugin(pluginId: string): Promise<void> {
    await this.lifecycleManager.deactivatePlugin(pluginId);
  }

  // 获取插件
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  // 获取所有插件
  getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  // 获取活跃插件
  getActivePlugins(): IPlugin[] {
    return this.getPlugins().filter(plugin => plugin.state === PluginState.Active);
  }

  // 按状态获取插件
  getPluginsByState(state: PluginState): IPlugin[] {
    return this.getPlugins().filter(plugin => plugin.state === state);
  }

  // 激活插件
  async activatePlugin(pluginId: string): Promise<void> {
    await this.enablePlugin(pluginId);
  }

  // 停用插件
  async deactivatePlugin(pluginId: string): Promise<void> {
    await this.disablePlugin(pluginId);
  }

  // 按事件激活插件
  async activateByEvent(activationEvent: string): Promise<void> {
    const pluginsToActivate = this.getPlugins().filter(plugin => {
      const events = plugin.manifest.activationEvents || [];
      return events.includes(activationEvent) && plugin.state === PluginState.Loaded;
    });

    await Promise.all(pluginsToActivate.map(plugin => this.activatePlugin(plugin.id)));
  }

  // 解析依赖
  async resolveDependencies(pluginId: string): Promise<IPlugin[]> {
    const dependencyIds = await this.dependencyResolver.resolveDependencies(pluginId);
    return dependencyIds.map(id => this.plugins.get(id)!).filter(Boolean);
  }

  // 获取依赖此插件的插件
  getDependents(pluginId: string): IPlugin[] {
    const dependentIds = this.dependencyResolver.getDependents(pluginId);
    return dependentIds.map(id => this.plugins.get(id)!).filter(Boolean);
  }

  // 获取插件API
  getPluginApi(pluginId: string): any {
    const plugin = this.plugins.get(pluginId);
    return plugin?.exports;
  }

  // 暴露API
  exposeApi(pluginId: string, api: any): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      (plugin as any).exports = api;
    }
  }

  // 私有辅助方法
  private extractPluginIdFromUrl(url: string): string {
    // 从URL中提取插件ID的逻辑
    const match = url.match(/\/([^\/]+)$/);
    return match ? match[1] : url;
  }

  private async loadLocalPlugin(path: string): Promise<ArrayBuffer> {
    // 加载本地插件文件的逻辑
    // 在实际实现中，这里应该使用文件系统API
    throw new Error('Local plugin loading not implemented');
  }

  private async extractManifestFromPlugin(data: ArrayBuffer): Promise<IPluginManifest> {
    // 从插件数据中提取manifest的逻辑
    // 在实际实现中，这里应该解析插件包格式（如ZIP）
    throw new Error('Plugin manifest extraction not implemented');
  }

  private async createPluginInstance(manifest: IPluginManifest, data: ArrayBuffer): Promise<IPlugin> {
    // 创建插件实例的逻辑
    // 在实际实现中，这里应该加载插件代码并创建实例
    const plugin: IPlugin = {
      id: manifest.id,
      manifest,
      state: PluginState.Loaded,
      context: {} as any,
      exports: undefined,
      activate: async () => {},
      deactivate: async () => {},
      dispose: () => {},
      onDidChangeState: {
        fire: () => {},
        event: () => ({ dispose: () => {} })
      } as any
    };

    return plugin;
  }

  private createPluginContext(plugin: IPlugin): IPluginContext {
    // 创建插件上下文的逻辑
    return {
      subscriptions: [],
      workspaceState: {
        get: () => undefined,
        update: async () => {}
      } as any,
      globalState: {
        get: () => undefined,
        update: async () => {}
      } as any,
      extensionPath: `/plugins/${plugin.id}`,
      extensionUri: `luckin://plugin/${plugin.id}`,
      globalStoragePath: `/storage/global/${plugin.id}`,
      logPath: `/logs/${plugin.id}`,
      extensionMode: 1, // Production
      environmentVariableCollection: {
        persistent: false,
        replace: () => {},
        append: () => {},
        prepend: () => {},
        get: () => undefined,
        forEach: () => {},
        delete: () => {},
        clear: () => {}
      } as any,
      asAbsolutePath: (relativePath: string) => `/plugins/${plugin.id}/${relativePath}`
    };
  }

  // BaseService abstract method implementations
  protected onInitialize(): void | Promise<void> {
    // Initialize plugin service
  }

  protected onDispose(): void | Promise<void> {
    // 停用所有活跃插件
    const activePlugins = this.getActivePlugins();
    Promise.all(activePlugins.map(plugin => this.deactivatePlugin(plugin.id)))
      .catch(error => console.error('Error deactivating plugins:', error));

    // 清理所有插件
    for (const plugin of this.plugins.values()) {
      if (plugin.dispose) {
        plugin.dispose();
      }
    }

    this.plugins.clear();
    this.eventEmitter.removeAllListeners();
  }

  // 清理资源
  dispose(): void {
    super.dispose();
  }
}