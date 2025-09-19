import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Search, 
  Download, 
  Trash2, 
  Settings, 
  Star, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  Package,
  Loader2,
  RefreshCw,
  Filter,
  Grid,
  List,
  Info,
  Shield,
  Users,
  Calendar,
  FileText,
  Globe
} from 'lucide-react';
import type { IPlugin } from '@lgnixai/luckin-types';
import { useLayoutStore } from '@lgnixai/luckin-core-legacy';

// 临时导入 PluginState 枚举定义
enum PluginState {
  Unloaded = 'unloaded',
  Loading = 'loading',
  Loaded = 'loaded',
  Activating = 'activating',
  Active = 'active',
  Deactivating = 'deactivating',
  Deactivated = 'deactivated',
  Failed = 'failed'
}

// 插件分类
export enum PluginCategory {
  Productivity = 'productivity',
  Editor = 'editor',
  Language = 'language',
  Theme = 'theme',
  Debug = 'debug',
  Git = 'git',
  Utility = 'utility',
  Other = 'other'
}

// 插件来源
export enum PluginSource {
  Official = 'official',
  Community = 'community',
  Local = 'local',
  Development = 'development'
}

// 扩展的插件信息接口
export interface IExtendedPlugin extends IPlugin {
  downloadCount?: number;
  rating?: number;
  reviewCount?: number;
  lastUpdated?: string;
  size?: string;
  category?: PluginCategory;
  source?: PluginSource;
  screenshots?: string[];
  changelog?: string;
  dependencies?: string[];
  conflicts?: string[];
  isInstalling?: boolean;
  isUninstalling?: boolean;
  hasUpdate?: boolean;
  updateVersion?: string;
}

// 插件管理器属性
export interface ExtensionManagerProps {
  className?: string;
}

// 插件服务接口（模拟）
class PluginService {
  private plugins: Map<string, IExtendedPlugin> = new Map();
  private installedPlugins: Set<string> = new Set();

  // 模拟数据
  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockPlugins: IExtendedPlugin[] = [
      {
        id: 'hello-world',
        manifest: {
          id: 'hello-world',
          name: 'Hello World 扩展',
          displayName: 'Hello World 扩展',
          version: '1.0.0',
          description: '一个简单的Hello World扩展，演示基本的插件功能，包括活动栏图标、侧边栏内容和命令交互。',
          author: 'Luckin IDE Team',
          publisher: 'luckin-team',
          engines: { luckin: '^3.0.0' },
          categories: ['Other'],
          keywords: ['demo', 'hello-world', 'example', 'tutorial']
        },
        state: PluginState.Active,
        context: {} as any,
        exports: {},
        activate: async () => {},
        dispose: () => {},
        onDidChangeState: {} as any,
        downloadCount: 1000,
        rating: 5.0,
        reviewCount: 10,
        lastUpdated: '2025-09-19',
        size: '15 KB',
        category: PluginCategory.Other,
        source: PluginSource.Local
      },
      {
        id: 'markdown-preview',
        manifest: {
          id: 'markdown-preview',
          name: 'Markdown Preview Enhanced',
          displayName: 'Markdown Preview Enhanced',
          version: '0.6.8',
          description: 'Markdown Preview Enhanced ported to Luckin',
          author: 'shd101wyy',
          publisher: 'shd101wyy',
          engines: { luckin: '^1.74.0' },
          categories: ['Other'],
          keywords: ['markdown', 'preview', 'github']
        },
        state: PluginState.Active,
        context: {} as any,
        exports: {},
        activate: async () => {},
        dispose: () => {},
        onDidChangeState: {} as any,
        downloadCount: 125000,
        rating: 4.5,
        reviewCount: 234,
        lastUpdated: '2024-01-15',
        size: '2.3 MB',
        category: PluginCategory.Editor,
        source: PluginSource.Community
      },
      {
        id: 'theme-dracula',
        manifest: {
          id: 'theme-dracula',
          name: 'Dracula Official',
          displayName: 'Dracula Official',
          version: '2.24.2',
          description: 'Official Dracula Theme. A dark theme for many editors, shells, and more.',
          author: 'dracula-theme',
          publisher: 'dracula-theme',
          engines: { luckin: '^1.0.0' },
          categories: ['Themes'],
          keywords: ['theme', 'dark', 'dracula']
        },
        state: PluginState.Loaded,
        context: {} as any,
        exports: {},
        activate: async () => {},
        dispose: () => {},
        onDidChangeState: {} as any,
        downloadCount: 2100000,
        rating: 4.8,
        reviewCount: 1205,
        lastUpdated: '2024-01-20',
        size: '156 KB',
        category: PluginCategory.Theme,
        source: PluginSource.Official
      },
      {
        id: 'git-lens',
        manifest: {
          id: 'git-lens',
          name: 'GitLens — Git supercharged',
          displayName: 'GitLens — Git supercharged',
          version: '14.7.0',
          description: 'Supercharge Git within Luckin — Visualize code authorship at a glance via Git blame annotations',
          author: 'Eric Amodio',
          publisher: 'eamodio',
          engines: { luckin: '^1.74.0' },
          categories: ['Other'],
          keywords: ['git', 'lens', 'blame', 'history']
        },
        state: PluginState.Unloaded,
        context: {} as any,
        exports: {},
        activate: async () => {},
        dispose: () => {},
        onDidChangeState: {} as any,
        downloadCount: 15000000,
        rating: 4.7,
        reviewCount: 3421,
        lastUpdated: '2024-01-18',
        size: '8.2 MB',
        category: PluginCategory.Git,
        source: PluginSource.Community,
        hasUpdate: true,
        updateVersion: '14.8.0'
      }
    ];

    mockPlugins.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
      if (plugin.state === PluginState.Active || plugin.state === PluginState.Loaded) {
        this.installedPlugins.add(plugin.id);
      }
    });
  }

  async getInstalledPlugins(): Promise<IExtendedPlugin[]> {
    return Array.from(this.installedPlugins).map(id => this.plugins.get(id)!).filter(Boolean);
  }

  async searchPlugins(query: string, category?: PluginCategory): Promise<IExtendedPlugin[]> {
    const allPlugins = Array.from(this.plugins.values());
    return allPlugins.filter(plugin => {
      const matchesQuery = !query || 
        plugin.manifest.name.toLowerCase().includes(query.toLowerCase()) ||
        plugin.manifest.description?.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || plugin.category === category;
      return matchesQuery && matchesCategory;
    });
  }

  async installPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.isInstalling = true;
      // 模拟安装过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      plugin.isInstalling = false;
      plugin.state = PluginState.Loaded;
      this.installedPlugins.add(pluginId);
    }
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.isUninstalling = true;
      // 模拟卸载过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      plugin.isUninstalling = false;
      plugin.state = PluginState.Unloaded;
      this.installedPlugins.delete(pluginId);
    }
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin && this.installedPlugins.has(pluginId)) {
      plugin.state = PluginState.Active;
    }
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin && this.installedPlugins.has(pluginId)) {
      plugin.state = PluginState.Loaded;
    }
  }

  async updatePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (plugin && plugin.hasUpdate) {
      plugin.isInstalling = true;
      await new Promise(resolve => setTimeout(resolve, 2500));
      plugin.isInstalling = false;
      plugin.manifest.version = plugin.updateVersion || plugin.manifest.version;
      plugin.hasUpdate = false;
      plugin.updateVersion = undefined;
    }
  }
}

// 插件卡片组件
const PluginCard: React.FC<{
  plugin: IExtendedPlugin;
  isInstalled: boolean;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  onUpdate: (id: string) => void;
  viewMode: 'grid' | 'list';
}> = ({ plugin, isInstalled, onInstall, onUninstall, onEnable, onDisable, onUpdate, viewMode }) => {
  const getStateColor = (state: PluginState) => {
    switch (state) {
      case PluginState.Active: return 'text-green-600';
      case PluginState.Loaded: return 'text-blue-600';
      case PluginState.Failed: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStateIcon = (state: PluginState) => {
    switch (state) {
      case PluginState.Active: return <CheckCircle className="w-4 h-4" />;
      case PluginState.Loaded: return <Package className="w-4 h-4" />;
      case PluginState.Failed: return <AlertCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const isActive = plugin.state === PluginState.Active;
  const isLoading = plugin.isInstalling || plugin.isUninstalling;

  if (viewMode === 'list') {
    return (
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex items-center space-x-2">
                <div className={cn("flex items-center", getStateColor(plugin.state))}>
                  {getStateIcon(plugin.state)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{plugin.manifest.displayName}</h3>
                  <p className="text-xs text-muted-foreground">{plugin.manifest.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>v{plugin.manifest.version}</span>
                <span>{plugin.size}</span>
                {plugin.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{plugin.rating}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {plugin.hasUpdate && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUpdate(plugin.id)}
                  disabled={isLoading}
                >
                  {plugin.isInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update'}
                </Button>
              )}
              
              {isInstalled ? (
                <>
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => checked ? onEnable(plugin.id) : onDisable(plugin.id)}
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onUninstall(plugin.id)}
                    disabled={isLoading}
                  >
                    {plugin.isUninstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onInstall(plugin.id)}
                  disabled={isLoading}
                >
                  {plugin.isInstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 获取插件图标
  const getPluginIcon = (pluginId: string) => {
    switch (pluginId) {
      case 'hello-world': return '👋';
      case 'markdown-preview': return '📝';
      case 'theme-dracula': return '🧛';
      default: return plugin.manifest.displayName?.charAt(0) || plugin.manifest.name.charAt(0);
    }
  };

  return (
    <Card className="relative hover:shadow-lg transition-all duration-200 border hover:border-blue-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">
              {getPluginIcon(plugin.id)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-base font-semibold truncate">{plugin.manifest.displayName}</CardTitle>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  v{plugin.manifest.version}
                </Badge>
                {plugin.source === PluginSource.Official && (
                  <Badge variant="default" className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                    Official
                  </Badge>
                )}
                {plugin.source === PluginSource.Local && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 border-green-300 text-green-700 bg-green-50">
                    Local
                  </Badge>
                )}
                {plugin.hasUpdate && (
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    Update Available
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm mb-3 line-clamp-2 leading-relaxed text-gray-600">
                {plugin.manifest.description}
              </CardDescription>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                {plugin.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{plugin.rating.toFixed(1)}</span>
                  </div>
                )}
                <span>•</span>
                <span>{plugin.downloadCount?.toLocaleString()} downloads</span>
                <span>•</span>
                <span className="font-medium">{plugin.size}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2 ml-4">
            {plugin.hasUpdate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUpdate(plugin.id)}
                disabled={isLoading}
                className="px-4"
              >
                {plugin.isInstalling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update
              </Button>
            )}
            
            {isInstalled ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => checked ? onEnable(plugin.id) : onDisable(plugin.id)}
                    disabled={isLoading}
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {isActive ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onUninstall(plugin.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                >
                  {plugin.isUninstalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 px-4"
                onClick={() => onInstall(plugin.id)}
                disabled={isLoading}
              >
                {plugin.isInstalling ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Download className="w-3 h-3 mr-1" />
                )}
                Install
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 插件详情对话框
const PluginDetailsDialog: React.FC<{
  plugin: IExtendedPlugin | null;
  isOpen: boolean;
  onClose: () => void;
}> = ({ plugin, isOpen, onClose }) => {
  if (!plugin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>{plugin.manifest.displayName}</span>
          </DialogTitle>
          <DialogDescription>
            {plugin.manifest.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Basic Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span>{plugin.manifest.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Author:</span>
                  <span>{plugin.manifest.author}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publisher:</span>
                  <span>{plugin.manifest.publisher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span>{plugin.size}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Downloads:</span>
                  <span>{plugin.downloadCount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{plugin.rating}</span>
                    <span className="text-muted-foreground">({plugin.reviewCount} reviews)</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{plugin.lastUpdated}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 依赖关系 */}
          {plugin.dependencies && plugin.dependencies.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Dependencies</h4>
              <div className="flex flex-wrap gap-1">
                {plugin.dependencies.map(dep => (
                  <Badge key={dep} variant="outline" className="text-xs">{dep}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* 链接 */}
          <div className="flex space-x-2">
            {plugin.manifest.homepage && (
              <Button variant="outline" size="sm" asChild>
                <a href={plugin.manifest.homepage} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-3 h-3 mr-1" />
                  Homepage
                </a>
              </Button>
            )}
            {plugin.manifest.repository && (
              <Button variant="outline" size="sm" asChild>
                <a href={plugin.manifest.repository} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Repository
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 主要的扩展管理器组件
export const ExtensionManager: React.FC<ExtensionManagerProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PluginCategory | ''>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPlugin, setSelectedPlugin] = useState<IExtendedPlugin | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [installedPlugins, setInstalledPlugins] = useState<IExtendedPlugin[]>([]);
  const [marketplacePlugins, setMarketplacePlugins] = useState<IExtendedPlugin[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 添加layout store用于活动栏同步
  const { addActivityItem, removeActivityItem } = useLayoutStore();
  
  const pluginService = useMemo(() => new PluginService(), []);

  // 加载已安装插件
  const loadInstalledPlugins = async () => {
    setLoading(true);
    try {
      const plugins = await pluginService.getInstalledPlugins();
      setInstalledPlugins(plugins);
      
      // 为已启用的插件添加活动栏项目
      plugins.forEach(plugin => {
        if (plugin.state === PluginState.Active) {
          const getPluginActivityIcon = (id: string) => {
            switch (id) {
              case 'hello-world': return '👋';
              case 'markdown-preview': return '📝';
              case 'theme-dracula': return '🧛';
              default: return '📦';
            }
          };
          
          addActivityItem({
            id: plugin.id,
            label: plugin.manifest.displayName || plugin.manifest.name,
            icon: getPluginActivityIcon(plugin.id)
          });
        }
      });
    } catch (error) {
      console.error('Failed to load installed plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  // 搜索市场插件
  const searchMarketplacePlugins = async () => {
    setLoading(true);
    try {
      const plugins = await pluginService.searchPlugins(
        searchQuery, 
        selectedCategory || undefined
      );
      setMarketplacePlugins(plugins);
    } catch (error) {
      console.error('Failed to search marketplace plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstalledPlugins();
  }, []);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      searchMarketplacePlugins();
    }
  }, [activeTab, searchQuery, selectedCategory]);

  const handleInstall = async (pluginId: string) => {
    try {
      await pluginService.installPlugin(pluginId);
      await loadInstalledPlugins();
      if (activeTab === 'marketplace') {
        await searchMarketplacePlugins();
      }
    } catch (error) {
      console.error('Failed to install plugin:', error);
    }
  };

  const handleUninstall = async (pluginId: string) => {
    try {
      await pluginService.uninstallPlugin(pluginId);
      await loadInstalledPlugins();
      if (activeTab === 'marketplace') {
        await searchMarketplacePlugins();
      }
    } catch (error) {
      console.error('Failed to uninstall plugin:', error);
    }
  };

  const handleEnable = async (pluginId: string) => {
    try {
      await pluginService.enablePlugin(pluginId);
      await loadInstalledPlugins();
      
      // 启用插件时，添加到活动栏
      const plugin = installedPlugins.find(p => p.id === pluginId);
      if (plugin) {
        // 获取插件图标
        const getPluginActivityIcon = (id: string) => {
          switch (id) {
            case 'hello-world': return '👋';
            case 'markdown-preview': return '📝';
            case 'theme-dracula': return '🧛';
            default: return '📦';
          }
        };
        
        addActivityItem({
          id: pluginId,
          label: plugin.manifest.displayName || plugin.manifest.name,
          icon: getPluginActivityIcon(pluginId)
        });
        
        console.log(`已启用插件并添加到活动栏: ${pluginId}`);
      }
    } catch (error) {
      console.error('Failed to enable plugin:', error);
    }
  };

  const handleDisable = async (pluginId: string) => {
    try {
      await pluginService.disablePlugin(pluginId);
      await loadInstalledPlugins();
      
      // 禁用插件时，从活动栏移除
      removeActivityItem(pluginId);
      console.log(`已禁用插件并从活动栏移除: ${pluginId}`);
    } catch (error) {
      console.error('Failed to disable plugin:', error);
    }
  };

  const handleUpdate = async (pluginId: string) => {
    try {
      await pluginService.updatePlugin(pluginId);
      await loadInstalledPlugins();
    } catch (error) {
      console.error('Failed to update plugin:', error);
    }
  };

  const installedPluginIds = new Set(installedPlugins.map(p => p.id));
  const pluginsWithUpdates = installedPlugins.filter(p => p.hasUpdate);

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Extensions
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadInstalledPlugins}
              disabled={loading}
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installed" className="flex items-center space-x-2">
              <span>Installed</span>
              {installedPlugins.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {installedPlugins.length}
                </Badge>
              )}
              {pluginsWithUpdates.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pluginsWithUpdates.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 p-4 border-b space-y-3">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as PluginCategory | '')}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">All Categories</option>
            {Object.values(PluginCategory).map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {pluginsWithUpdates.length > 0 && activeTab === 'installed' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {pluginsWithUpdates.length} extension(s) have updates available.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab}>
          <TabsContent value="installed" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : installedPlugins.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No extensions installed</p>
                <p className="text-sm">Browse the marketplace to find extensions</p>
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "space-y-4" 
                  : "space-y-2"
              )}>
                {installedPlugins.map(plugin => (
                  <div
                    key={plugin.id}
                    onClick={() => {
                      setSelectedPlugin(plugin);
                      setIsDetailsOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <PluginCard
                      plugin={plugin}
                      isInstalled={true}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      onEnable={handleEnable}
                      onDisable={handleDisable}
                      onUpdate={handleUpdate}
                      viewMode={viewMode}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className={cn(
                viewMode === 'grid' 
                  ? "space-y-4" 
                  : "space-y-2"
              )}>
                {marketplacePlugins.map(plugin => (
                  <div
                    key={plugin.id}
                    onClick={() => {
                      setSelectedPlugin(plugin);
                      setIsDetailsOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <PluginCard
                      plugin={plugin}
                      isInstalled={installedPluginIds.has(plugin.id)}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      onEnable={handleEnable}
                      onDisable={handleDisable}
                      onUpdate={handleUpdate}
                      viewMode={viewMode}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Plugin Details Dialog */}
      <PluginDetailsDialog
        plugin={selectedPlugin}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default ExtensionManager;