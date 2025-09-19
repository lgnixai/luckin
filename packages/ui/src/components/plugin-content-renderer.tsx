import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    const loadPluginContent = async () => {
      setLoading(true);
      setError(null);

      try {
        // 根据插件ID构建插件内容URL
        const pluginUrl = `/plugins/${pluginId}/index.html`;
        
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
          timestamp: Date.now()
        }, '*');
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
