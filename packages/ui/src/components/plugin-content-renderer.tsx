import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { useCommandService } from '@lgnixai/luckin-core';
import { useNotificationService } from '@lgnixai/luckin-core-legacy';
import { useToastStore } from './toast-notification';

export interface PluginContentRendererProps {
  pluginId: string;
  className?: string;
}

export const PluginContentRenderer: React.FC<PluginContentRendererProps> = ({ 
  pluginId, 
  className 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { togglePalette, execute } = useCommandService();
  const { addNotification } = useNotificationService();
  const { addToast } = useToastStore();
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    const loadPluginContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // 根据插件ID构建插件内容URL，指向Go后端服务器
        const goBackendUrl = 'http://localhost:8080';
        const pluginUrl = `${goBackendUrl}/plugins/${pluginId}/`;
        console.log('Loading plugin from Go backend:', pluginUrl)

        
        if (iframeRef.current) {
          iframeRef.current.src = pluginUrl;
        }
      } catch (err) {
        setError(`加载插件失败: ${err instanceof Error ? err.message : '未知错误'}`);
        setLoading(false);
      }
    };

    if (pluginId) {
      loadPluginContent();
    }
  }, [pluginId]);

  const handleIframeLoad = () => {
    setLoading(false);
    
    // 尝试与插件进行通信设置
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        // 向插件发送初始化消息
        iframeRef.current.contentWindow.postMessage({
          type: 'luckin-plugin-init',
          pluginId: pluginId,
          apiVersion: 1,
          hostOrigin: window.location.origin,
          hostBaseUrl: 'http://localhost:8080',
          capabilities: {
            rpc: [
              'notifications.show',
              'storage.get',
              'storage.set',
              'storage.remove',
              'commands.execute',
              'ui.toggleCommandPalette',
              'host.getInfo'
            ]
          },
          timestamp: Date.now()
        }, window.location.origin);
      } catch (err) {
        console.warn('Failed to initialize plugin communication:', err);
      }
    }
  };

  const handleIframeError = () => {
    setError('插件内容加载失败');
    setLoading(false);
  };

  // 监听来自插件的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 只处理来自我们的插件iframe的消息
      if (event.source === iframeRef.current?.contentWindow) {
        try {
          const data = event.data;
          
          if (data.type === 'luckin-plugin-ready') {
            console.log(`Plugin ${pluginId} is ready`);
            // 可选：向插件确认
            iframeRef.current?.contentWindow?.postMessage({ type: 'luckin-plugin-ack', pluginId, timestamp: Date.now() }, window.location.origin);
            return;
          }
          
          // 插件 RPC 调用
          if (data.type === 'luckin-rpc' && typeof data.method === 'string') {
            const reqId = data.id ?? `rpc-${++requestIdRef.current}`;
            const respond = (result: any) => {
              iframeRef.current?.contentWindow?.postMessage({ type: 'luckin-rpc-result', id: reqId, result }, window.location.origin);
            };
            const respondError = (message: string, code = 400) => {
              iframeRef.current?.contentWindow?.postMessage({ type: 'luckin-rpc-error', id: reqId, error: { code, message } }, window.location.origin);
            };

            const method: string = data.method;
            const params = data.params || {};
            
            // 简单权限/白名单
            const allowed = new Set([
              'notifications.show',
              'storage.get',
              'storage.set',
              'storage.remove',
              'commands.execute',
              'ui.toggleCommandPalette',
              'host.getInfo',
            ]);
            if (!allowed.has(method)) {
              respondError(`Method not allowed: ${method}`, 403);
              return;
            }

            (async () => {
              switch (method) {
                case 'notifications.show': {
                  const { type = 'info', title, message, duration } = params || {};
                  try {
                    // 显示系统级toast通知（右下角）
                    addToast({
                      title: title || '插件通知',
                      message: message || '来自插件的消息',
                      type: type as 'info' | 'success' | 'warning' | 'error',
                      duration: duration || 2000 // 默认2秒自动关闭
                    });
                    
                    // 同时添加到通知中心（保留历史记录）
                    const value = [title, message].filter(Boolean).join(': ');
                    addNotification({ 
                      id: `${pluginId}-${Date.now()}`, 
                      value: value || message || title || '插件通知', 
                      type: type as 'info' | 'success' | 'warning' | 'error'
                    });
                    
                    respond({ ok: true });
                  } catch (e: any) {
                    respondError(e?.message || 'failed to show notification');
                  }
                  break;
                }
                case 'storage.get': {
                  const { key } = params || {};
                  if (!key) return respondError('missing key');
                  try {
                    const raw = localStorage.getItem(`luckin-plugin:${pluginId}:${key}`);
                    let value: any = null;
                    if (raw != null) {
                      try { value = JSON.parse(raw); } catch { value = raw; }
                    }
                    respond({ value });
                  } catch (e: any) {
                    respondError(e?.message || 'storage.get failed');
                  }
                  break;
                }
                case 'storage.set': {
                  const { key, value } = params || {};
                  if (!key) return respondError('missing key');
                  try {
                    const toSave = typeof value === 'string' ? value : JSON.stringify(value);
                    localStorage.setItem(`luckin-plugin:${pluginId}:${key}`, toSave);
                    respond({ ok: true });
                  } catch (e: any) {
                    respondError(e?.message || 'storage.set failed');
                  }
                  break;
                }
                case 'storage.remove': {
                  const { key } = params || {};
                  if (!key) return respondError('missing key');
                  try {
                    localStorage.removeItem(`luckin-plugin:${pluginId}:${key}`);
                    respond({ ok: true });
                  } catch (e: any) {
                    respondError(e?.message || 'storage.remove failed');
                  }
                  break;
                }
                case 'commands.execute': {
                  const { id } = params || {};
                  if (!id) return respondError('missing command id');
                  try {
                    await execute(id);
                    respond({ ok: true });
                  } catch (e: any) {
                    respondError(e?.message || 'execute failed');
                  }
                  break;
                }
                case 'ui.toggleCommandPalette': {
                  try {
                    togglePalette(true);
                    respond({ ok: true });
                  } catch (e: any) {
                    respondError(e?.message || 'toggle palette failed');
                  }
                  break;
                }
                case 'host.getInfo': {
                  respond({ pluginId, origin: window.location.origin });
                  break;
                }
                default:
                  respondError(`unknown method: ${method}`, 404);
              }
            })();
            return;
          } else if (data.type === 'luckin-plugin-error') {
            setError(data.message || '插件运行时错误');
          }
        } catch (err) {
          console.warn('Error handling plugin message:', err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [pluginId]);

  if (error) {
    return (
      <div className={cn("flex flex-col h-full p-4", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>加载插件内容...</span>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        title={`Plugin: ${pluginId}`}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ 
          minHeight: '100%',
          backgroundColor: 'var(--background)'
        }}
      />
    </div>
  );
};

export default PluginContentRenderer;
