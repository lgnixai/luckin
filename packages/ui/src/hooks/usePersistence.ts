import { useCallback, useEffect, useState } from 'react';
import { useObsidianEditorStore } from "@/stores/obsidian-editor-store';
import { StateError } from "@/types/obsidian-editor';
import { storageManager } from "@/utils/storage-manager';
import { autoSaveService } from "@/utils/auto-save-service';

/**
 * 持久化相关的 Hook
 * 提供会话管理、自动保存等功能
 */
export function usePersistence() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<StateError | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const {
    saveSession,
    loadSession,
    clearSession,
    recoverSession,
    enableAutoSave,
    disableAutoSave,
    triggerAutoSave,
    saveImmediately,
    recoverAutoSavedContent,
    saveAllFiles,
    settings
  } = useObsidianEditorStore();

  /**
   * 手动保存会话
   */
  const handleSaveSession = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      await saveSession();
      setLastSaveTime(new Date());
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('storage', 'Failed to save session', true);
      setSaveError(stateError);
      throw stateError;
    } finally {
      setIsLoading(false);
    }
  }, [saveSession]);

  /**
   * 手动加载会话
   */
  const handleLoadSession = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      await loadSession();
      setLastSaveTime(new Date());
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('corruption', 'Failed to load session', false);
      setSaveError(stateError);
      throw stateError;
    } finally {
      setIsLoading(false);
    }
  }, [loadSession]);

  /**
   * 清除会话数据
   */
  const handleClearSession = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      await clearSession();
      setLastSaveTime(null);
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('storage', 'Failed to clear session', true);
      setSaveError(stateError);
      throw stateError;
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  /**
   * 恢复会话（带错误处理）
   */
  const handleRecoverSession = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      const result = await recoverSession();
      setLastSaveTime(new Date());
      return result;
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('corruption', 'Failed to recover session', false);
      setSaveError(stateError);
      throw stateError;
    } finally {
      setIsLoading(false);
    }
  }, [recoverSession]);

  /**
   * 保存所有文件
   */
  const handleSaveAllFiles = useCallback(async () => {
    setIsLoading(true);
    setSaveError(null);
    
    try {
      const result = await saveAllFiles();
      setLastSaveTime(new Date());
      return result;
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('storage', 'Failed to save files', true);
      setSaveError(stateError);
      throw stateError;
    } finally {
      setIsLoading(false);
    }
  }, [saveAllFiles]);

  /**
   * 立即保存指定标签页
   */
  const handleSaveImmediately = useCallback(async (tabId: string) => {
    try {
      const success = await saveImmediately(tabId);
      if (success) {
        setLastSaveTime(new Date());
      }
      return success;
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('storage', 'Failed to save tab', true);
      setSaveError(stateError);
      throw stateError;
    }
  }, [saveImmediately]);

  /**
   * 恢复自动保存的内容
   */
  const handleRecoverAutoSavedContent = useCallback(async (tabId: string) => {
    try {
      return await recoverAutoSavedContent(tabId);
    } catch (error) {
      console.error('Failed to recover auto-saved content:', error);
      return { content: null, timestamp: null, hasRecovery: false };
    }
  }, [recoverAutoSavedContent]);

  /**
   * 切换自动保存
   */
  const toggleAutoSave = useCallback((enabled?: boolean) => {
    const newState = enabled !== undefined ? enabled : !autoSaveEnabled;
    
    if (newState) {
      enableAutoSave();
    } else {
      disableAutoSave();
    }
    
    setAutoSaveEnabled(newState);
  }, [autoSaveEnabled, enableAutoSave, disableAutoSave]);

  /**
   * 触发标签页自动保存
   */
  const handleTriggerAutoSave = useCallback((tabId: string) => {
    triggerAutoSave(tabId);
  }, [triggerAutoSave]);

  /**
   * 检查存储空间
   */
  const checkStorageSpace = useCallback(async () => {
    try {
      return await storageManager.checkStorageSpace();
    } catch (error) {
      console.error('Failed to check storage space:', error);
      return { available: false };
    }
  }, []);

  /**
   * 获取自动保存统计信息
   */
  const getAutoSaveStats = useCallback(() => {
    return autoSaveService.getAutoSaveStats();
  }, []);

  // 监听设置变化
  useEffect(() => {
    setAutoSaveEnabled(settings.autoSave);
  }, [settings.autoSave]);

  // 清理错误状态
  const clearError = useCallback(() => {
    setSaveError(null);
  }, []);

  return {
    // 状态
    isLoading,
    lastSaveTime,
    saveError,
    autoSaveEnabled,
    
    // 会话操作
    saveSession: handleSaveSession,
    loadSession: handleLoadSession,
    clearSession: handleClearSession,
    recoverSession: handleRecoverSession,
    
    // 文件保存操作
    saveAllFiles: handleSaveAllFiles,
    saveImmediately: handleSaveImmediately,
    
    // 自动保存操作
    toggleAutoSave,
    triggerAutoSave: handleTriggerAutoSave,
    recoverAutoSavedContent: handleRecoverAutoSavedContent,
    
    // 工具方法
    checkStorageSpace,
    getAutoSaveStats,
    clearError
  };
}

/**
 * 会话恢复 Hook
 * 专门用于应用启动时的会话恢复
 */
export function useSessionRecovery() {
  const [recoveryState, setRecoveryState] = useState<{
    isRecovering: boolean;
    recovered: boolean;
    errors: StateError[];
    warnings: string[];
  }>({
    isRecovering: false,
    recovered: false,
    errors: [],
    warnings: []
  });

  const { recoverSession } = useObsidianEditorStore();

  /**
   * 执行会话恢复
   */
  const performRecovery = useCallback(async () => {
    setRecoveryState(prev => ({ ...prev, isRecovering: true }));
    
    try {
      const result = await recoverSession();
      
      setRecoveryState({
        isRecovering: false,
        recovered: result.recovered,
        errors: result.errors,
        warnings: result.warnings
      });
      
      return result;
    } catch (error) {
      const stateError = error instanceof StateError ? error : 
        new StateError('corruption', 'Recovery failed', false);
      
      setRecoveryState({
        isRecovering: false,
        recovered: false,
        errors: [stateError],
        warnings: []
      });
      
      throw stateError;
    }
  }, [recoverSession]);

  /**
   * 清除恢复状态
   */
  const clearRecoveryState = useCallback(() => {
    setRecoveryState({
      isRecovering: false,
      recovered: false,
      errors: [],
      warnings: []
    });
  }, []);

  return {
    ...recoveryState,
    performRecovery,
    clearRecoveryState
  };
}

/**
 * 自动保存状态 Hook
 */
export function useAutoSaveStatus() {
  const [stats, setStats] = useState(autoSaveService.getAutoSaveStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(autoSaveService.getAutoSaveStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return stats;
}