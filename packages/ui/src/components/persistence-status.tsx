import React, { useState, useEffect } from 'react';
import { usePersistence, useAutoSaveStatus } from "@/hooks/usePersistence';
import { StateError } from "@/types/obsidian-editor';

interface PersistenceStatusProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * 持久化状态组件
 * 显示保存状态、自动保存信息和错误提示
 */
export function PersistenceStatus({ className = '', showDetails = false }: PersistenceStatusProps) {
  const {
    isLoading,
    lastSaveTime,
    saveError,
    autoSaveEnabled,
    saveSession,
    clearError
  } = usePersistence();
  
  const autoSaveStats = useAutoSaveStatus();
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // 格式化最后保存时间
  const formatLastSaveTime = (time: Date | null) => {
    if (!time) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    
    if (diff < 60000) { // 小于1分钟
      return 'Just now';
    } else if (diff < 3600000) { // 小于1小时
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    } else if (diff < 86400000) { // 小于1天
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  // 获取状态图标和颜色
  const getStatusInfo = () => {
    if (isLoading) {
      return { icon: '⏳', color: 'text-blue-500', text: 'Saving...' };
    }
    
    if (saveError) {
      return { icon: '❌', color: 'text-red-500', text: 'Save failed' };
    }
    
    if (autoSaveStats.pendingSaves > 0) {
      return { icon: '💾', color: 'text-yellow-500', text: 'Auto-saving...' };
    }
    
    if (autoSaveEnabled) {
      return { icon: '✅', color: 'text-green-500', text: 'Auto-save on' };
    }
    
    return { icon: '⚪', color: 'text-gray-500', text: 'Auto-save off' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* 状态指示器 */}
      <div className="flex items-center space-x-1">
        <span className="text-sm">{statusInfo.icon}</span>
        <span className={`text-xs ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>

      {/* 最后保存时间 */}
      {lastSaveTime && (
        <span className="text-xs text-gray-400">
          {formatLastSaveTime(lastSaveTime)}
        </span>
      )}

      {/* 详细信息 */}
      {showDetails && (
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          {autoSaveStats.activeTimers > 0 && (
            <span>⏲️ {autoSaveStats.activeTimers}</span>
          )}
          {autoSaveStats.pendingSaves > 0 && (
            <span>📝 {autoSaveStats.pendingSaves}</span>
          )}
        </div>
      )}

      {/* 错误指示器 */}
      {saveError && (
        <div className="relative">
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            className="text-red-500 hover:text-red-600 text-xs"
            title="Click for error details"
          >
            ⚠️
          </button>
          
          {showErrorDetails && (
            <div className="absolute top-full right-0 mt-1 p-2 bg-red-50 border border-red-200 rounded shadow-lg z-50 min-w-64">
              <div className="text-xs">
                <div className="font-semibold text-red-700 mb-1">
                  Save Error ({saveError.type})
                </div>
                <div className="text-red-600 mb-2">
                  {saveError.message}
                </div>
                <div className="flex space-x-2">
                  {saveError.recoverable && (
                    <button
                      onClick={async () => {
                        try {
                          await saveSession();
                          clearError();
                          setShowErrorDetails(false);
                        } catch (error) {
                          console.error('Retry save failed:', error);
                        }
                      }}
                      className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                    >
                      Retry
                    </button>
                  )}
                  <button
                    onClick={() => {
                      clearError();
                      setShowErrorDetails(false);
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 简化的持久化状态组件
 * 只显示基本的保存状态
 */
export function SimplePersistenceStatus({ className = '' }: { className?: string }) {
  return <PersistenceStatus className={className} showDetails={false} />;
}

/**
 * 详细的持久化状态组件
 * 显示完整的保存状态和统计信息
 */
export function DetailedPersistenceStatus({ className = '' }: { className?: string }) {
  return <PersistenceStatus className={className} showDetails={true} />;
}

/**
 * 持久化控制面板组件
 * 提供手动保存、清除会话等操作
 */
export function PersistenceControlPanel({ className = '' }: { className?: string }) {
  const {
    isLoading,
    autoSaveEnabled,
    saveSession,
    clearSession,
    saveAllFiles,
    toggleAutoSave,
    checkStorageSpace
  } = usePersistence();

  const [storageInfo, setStorageInfo] = useState<{
    available: boolean;
    usage?: number;
    quota?: number;
  } | null>(null);

  // 检查存储空间
  useEffect(() => {
    checkStorageSpace().then(setStorageInfo);
  }, [checkStorageSpace]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
      <h3 className="text-sm font-semibold mb-3">Persistence Controls</h3>
      
      <div className="space-y-3">
        {/* 自动保存开关 */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto-save</span>
          <button
            onClick={() => toggleAutoSave()}
            className={`px-3 py-1 rounded text-xs ${
              autoSaveEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoSaveEnabled ? 'On' : 'Off'}
          </button>
        </div>

        {/* 手动操作按钮 */}
        <div className="flex space-x-2">
          <button
            onClick={saveSession}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs disabled:opacity-50"
          >
            Save Session
          </button>
          <button
            onClick={saveAllFiles}
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs disabled:opacity-50"
          >
            Save All
          </button>
        </div>

        <button
          onClick={clearSession}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs disabled:opacity-50"
        >
          Clear Session
        </button>

        {/* 存储信息 */}
        {storageInfo && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div>Storage: {storageInfo.available ? '✅ Available' : '❌ Full'}</div>
            {storageInfo.usage !== undefined && storageInfo.quota !== undefined && (
              <div>
                Used: {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
                ({Math.round((storageInfo.usage / storageInfo.quota) * 100)}%)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}