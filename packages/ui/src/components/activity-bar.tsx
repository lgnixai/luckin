import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as LucideIcons from 'lucide-react';

const { 
  FileText, 
  FolderOpen, 
  Search, 
  GitBranch, 
  Bug, 
  Package, 
  User, 
  Settings, 
  TestTube,
  AlertTriangle
} = LucideIcons;
import { useLayoutStore } from '@lginxai/luckin-core-legacy';

// Error Boundary for ActivityBar component
class ActivityBarErrorBoundary extends React.Component<
  { children: React.ReactNode; className?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; className?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[ActivityBar] Component error boundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // 渲染错误回退UI
      return (
        <div 
          data-testid="activity-bar-error" 
          className={cn("w-12 bg-sidebar border-r flex flex-col items-center py-2", this.props.className)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 mb-1 opacity-50"
            title="ActivityBar Error"
            disabled
            aria-label="ActivityBar encountered an error"
          >
            <AlertTriangle className="h-5 w-5" />
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ActivityIconMap {
  [key: string]: React.ComponentType<any>;
}

const ACTIVITY_ICONS: ActivityIconMap = {
  explorer: FolderOpen,      // 资源管理器
  search: Search,            // 搜索
  git: GitBranch,           // 源代码管理
  debug: Bug,               // 运行和调试
  extensions: Package,       // 扩展
  user: User,               // 用户
  settings: Settings,        // 设置
  test: TestTube,           // 测试
};

export interface ActivityBarProps {
  className?: string;
  iconMap?: ActivityIconMap; // 可选的自定义图标映射
}

const ActivityBarCore: React.FC<ActivityBarProps> = ({ className, iconMap }) => {
  // React hooks必须在组件顶层调用，不能在try-catch中
  const { layout, setSidebarCurrent } = useLayoutStore();
  // 安全地获取activities，包含防御性检查
  const activities = React.useMemo(() => {
    const defaultActivities = [
      { id: 'explorer', label: '资源管理器' },
      { id: 'search', label: '搜索' },
      { id: 'git', label: '源代码管理' },
      { id: 'debug', label: '运行和调试' },
      { id: 'extensions', label: '扩展' },
      { id: 'user', label: '用户' },
      { id: 'settings', label: '设置' },
      { id: 'test', label: '测试' },
    ];

    try {
      return layout?.activityItems || defaultActivities;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ActivityBar] Error accessing layout.activityItems, using defaults:', error);
      }
      return defaultActivities;
    }
  }, [layout]);

  // 验证和合并图标映射
  const finalIconMap = React.useMemo(() => {
    let validatedIconMap = { ...ACTIVITY_ICONS };
    
    if (iconMap) {
      if (typeof iconMap !== 'object' || iconMap === null) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ActivityBar] Invalid iconMap provided, expected an object. Using default icons only.');
        }
      } else {
        // 验证自定义图标映射中的每个图标
        Object.entries(iconMap).forEach(([key, IconComponent]) => {
          // React组件可能是function或object（对于React.forwardRef等）
          if (typeof IconComponent === 'function' || 
              (typeof IconComponent === 'object' && IconComponent !== null && 
               ((IconComponent as any).$$typeof || (IconComponent as any).render))) {
            validatedIconMap[key] = IconComponent;
          } else if (process.env.NODE_ENV === 'development') {
            console.warn(`[ActivityBar] Invalid icon component for key "${key}" in iconMap. Expected a React component, got: ${typeof IconComponent}`);
          }
        });
      }
    }
    
    return validatedIconMap;
  }, [iconMap]);

  // 获取活动项对应的图标组件，包含增强的错误处理和回退机制
  const getActivityIcon = (activityId: string): React.ComponentType<any> => {
    try {
      // 检查活动ID是否有效
      if (!activityId || typeof activityId !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[ActivityBar] Invalid activity ID provided: ${activityId}. Expected a non-empty string.`);
        }
        return FileText;
      }

      const IconComponent = finalIconMap[activityId];
      
      // 检查图标组件是否存在
      if (!IconComponent) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[ActivityBar] Icon not found for activity: "${activityId}". Available icons: ${Object.keys(finalIconMap).join(', ')}. Using default FileText icon.`);
        }
        return FileText;
      }

      // 检查图标组件是否为有效的React组件
      // React组件可能是function或object（对于React.forwardRef等）
      if (typeof IconComponent !== 'function' && 
          !(typeof IconComponent === 'object' && IconComponent !== null && 
            ((IconComponent as any).$$typeof || (IconComponent as any).render))) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[ActivityBar] Invalid icon component for activity: "${activityId}". Expected a React component, got: ${typeof IconComponent}. Using default FileText icon.`);
        }
        return FileText;
      }

      return IconComponent;
    } catch (error) {
      // 捕获任何意外错误
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ActivityBar] Unexpected error while getting icon for activity: "${activityId}":`, error);
      }
      return FileText;
    }
  };

  // 安全的图标渲染组件，包含错误边界处理
  const SafeIcon: React.FC<{ 
    IconComponent: React.ComponentType<any>; 
    activityId: string; 
    className?: string; 
  }> = ({ IconComponent, activityId, className }) => {
    try {
      return <IconComponent className={className} />;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ActivityBar] Error rendering icon for activity: "${activityId}":`, error);
      }
      // 渲染错误时使用警告图标
      return <AlertTriangle className={className} />;
    }
  };

  const handleActivityClick = (activityId: string) => {
    try {
      console.log(`活动栏点击: ${activityId}`);
      if (setSidebarCurrent && typeof setSidebarCurrent === 'function') {
        setSidebarCurrent(activityId as any);
      } else if (process.env.NODE_ENV === 'development') {
        console.warn('[ActivityBar] setSidebarCurrent is not available or not a function');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[ActivityBar] Error handling activity click for: "${activityId}":`, error);
      }
      // 即使点击处理失败，也不应该破坏整个组件
    }
  };

  // 验证activities数组的有效性
  const safeActivities = React.useMemo(() => {
    if (!Array.isArray(activities)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[ActivityBar] Activities is not an array, using empty array as fallback');
      }
      return [];
    }
    
    return activities.filter((activity) => {
      if (!activity || typeof activity !== 'object') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ActivityBar] Invalid activity object found, skipping:', activity);
        }
        return false;
      }
      
      if (!activity.id || typeof activity.id !== 'string') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ActivityBar] Activity missing valid id, skipping:', activity);
        }
        return false;
      }
      
      return true;
    });
  }, [activities]);

  return (
    <div data-testid="activity-bar" className={cn("w-12 bg-sidebar border-r flex flex-col items-center py-2", className)}>
      {safeActivities.map((activity) => {
        try {
          const isActive = layout?.sidebar?.current === activity.id;
          const IconComponent = getActivityIcon(activity.id);
          const activityLabel = activity.label || activity.id || 'Unknown Activity';
          
          return (
            <Button
              key={activity.id}
              variant="ghost"
              size="icon"
              className={cn(
                "w-10 h-10 mb-1",
                isActive && "bg-accent text-accent-foreground"
              )}
              title={activityLabel}
              onClick={() => handleActivityClick(activity.id)}
              aria-label={activityLabel}
            >
              <SafeIcon 
                IconComponent={IconComponent} 
                activityId={activity.id} 
                className="h-5 w-5" 
              />
            </Button>
          );
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`[ActivityBar] Error rendering activity button for: "${activity.id}":`, error);
          }
          // 返回一个错误状态的按钮，而不是完全跳过
          return (
            <Button
              key={activity.id || `error-${Math.random()}`}
              variant="ghost"
              size="icon"
              className="w-10 h-10 mb-1 opacity-50"
              title="Error loading activity"
              disabled
              aria-label="Error loading activity"
            >
              <AlertTriangle className="h-5 w-5" />
            </Button>
          );
        }
      })}
    </div>
  );
};

// Main export with error boundary wrapper
export const ActivityBar: React.FC<ActivityBarProps> = (props) => {
  return (
    <ActivityBarErrorBoundary className={props.className}>
      <ActivityBarCore {...props} />
    </ActivityBarErrorBoundary>
  );
};
