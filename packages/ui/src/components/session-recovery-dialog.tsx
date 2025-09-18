import React, { useState, useEffect } from 'react';
import { useSessionRecovery } from "@/hooks/usePersistence';
import { StateError } from "@/types/obsidian-editor';

interface SessionRecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRecoveryComplete: (recovered: boolean) => void;
}

/**
 * 会话恢复对话框组件
 * 在应用启动时显示，处理会话恢复过程
 */
export function SessionRecoveryDialog({
  isOpen,
  onClose,
  onRecoveryComplete
}: SessionRecoveryDialogProps) {
  const {
    isRecovering,
    recovered,
    errors,
    warnings,
    performRecovery,
    clearRecoveryState
  } = useSessionRecovery();

  const [showDetails, setShowDetails] = useState(false);
  const [userChoice, setUserChoice] = useState<'pending' | 'recover' | 'skip'>('pending');

  // 自动尝试恢复
  useEffect(() => {
    if (isOpen && userChoice === 'pending') {
      performRecovery().catch(console.error);
    }
  }, [isOpen, userChoice, performRecovery]);

  // 处理恢复完成
  useEffect(() => {
    if (!isRecovering && userChoice === 'pending') {
      if (recovered) {
        setUserChoice('recover');
      } else if (errors.length > 0) {
        // 如果有错误，让用户选择
        setUserChoice('pending');
      }
    }
  }, [isRecovering, recovered, errors.length, userChoice]);

  const handleContinue = () => {
    onRecoveryComplete(recovered);
    clearRecoveryState();
    onClose();
  };

  const handleSkipRecovery = () => {
    onRecoveryComplete(false);
    clearRecoveryState();
    onClose();
  };

  const handleRetryRecovery = async () => {
    setUserChoice('pending');
    try {
      await performRecovery();
    } catch (error) {
      console.error('Recovery retry failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* 标题 */}
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              {isRecovering ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : recovered ? (
                <span className="text-green-600">✓</span>
              ) : errors.length > 0 ? (
                <span className="text-red-600">⚠</span>
              ) : (
                <span className="text-blue-600">💾</span>
              )}
            </div>
            <h2 className="text-lg font-semibold">
              {isRecovering ? 'Recovering Session...' : 
               recovered ? 'Session Recovered' :
               errors.length > 0 ? 'Recovery Issues' :
               'Session Recovery'}
            </h2>
          </div>

          {/* 内容 */}
          <div className="mb-6">
            {isRecovering && (
              <p className="text-gray-600">
                Restoring your previous editing session...
              </p>
            )}

            {!isRecovering && recovered && (
              <div>
                <p className="text-gray-600 mb-2">
                  Your previous session has been successfully restored.
                </p>
                {warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <div className="text-sm text-yellow-800">
                      <div className="font-medium mb-1">Warnings:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isRecovering && !recovered && errors.length > 0 && (
              <div>
                <p className="text-gray-600 mb-3">
                  We encountered issues while trying to restore your session.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                  <div className="text-sm text-red-800">
                    <div className="font-medium mb-2">Errors:</div>
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <div key={index} className="border-l-2 border-red-300 pl-2">
                          <div className="font-medium">{error.type}</div>
                          <div>{error.message}</div>
                          {error.recoverable && (
                            <div className="text-xs text-red-600 mt-1">
                              This error is recoverable
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <div className="text-sm text-yellow-800">
                      <div className="font-medium mb-1">Additional Info:</div>
                      <ul className="list-disc list-inside space-y-1">
                        {warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  You can try to recover again, or start with a fresh session.
                </p>
              </div>
            )}
          </div>

          {/* 详细信息切换 */}
          {(warnings.length > 0 || errors.length > 0) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-700 mb-4"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          )}

          {/* 详细信息 */}
          {showDetails && (
            <div className="bg-gray-50 rounded p-3 mb-4 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Recovery Status:</span> {recovered ? 'Success' : 'Failed'}
                </div>
                <div>
                  <span className="font-medium">Errors:</span> {errors.length}
                </div>
                <div>
                  <span className="font-medium">Warnings:</span> {warnings.length}
                </div>
                <div>
                  <span className="font-medium">Recoverable Errors:</span> {errors.filter(e => e.recoverable).length}
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            {isRecovering ? (
              <button
                disabled
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-400 rounded cursor-not-allowed"
              >
                Please wait...
              </button>
            ) : recovered ? (
              <button
                onClick={handleContinue}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Continue
              </button>
            ) : (
              <>
                {errors.some(e => e.recoverable) && (
                  <button
                    onClick={handleRetryRecovery}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    Retry Recovery
                  </button>
                )}
                <button
                  onClick={handleSkipRecovery}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Start Fresh
                </button>
              </>
            )}
          </div>

          {/* 跳过选项 */}
          {!isRecovering && recovered && (
            <button
              onClick={handleSkipRecovery}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Start with a fresh session instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 自动保存恢复提示组件
 * 当检测到自动保存的内容时显示
 */
interface AutoSaveRecoveryPromptProps {
  tabId: string;
  tabTitle: string;
  autoSavedContent: string;
  currentContent: string;
  timestamp: number;
  onRecover: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

export function AutoSaveRecoveryPrompt({
  tabId,
  tabTitle,
  autoSavedContent,
  currentContent,
  timestamp,
  onRecover,
  onDiscard,
  onClose
}: AutoSaveRecoveryPromptProps) {
  const [showDiff, setShowDiff] = useState(false);
  
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    
    if (diff < 60000) {
      return 'just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-yellow-600">💾</span>
            </div>
            <h2 className="text-lg font-semibold">Auto-saved Content Found</h2>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              We found auto-saved content for <strong>{tabTitle}</strong> from {formatTimestamp(timestamp)}.
            </p>
            <p className="text-sm text-gray-500">
              Would you like to recover the auto-saved version or keep the current content?
            </p>
          </div>

          {/* 内容预览 */}
          <div className="mb-4">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="text-sm text-blue-600 hover:text-blue-700 mb-2"
            >
              {showDiff ? 'Hide' : 'Show'} Content Preview
            </button>

            {showDiff && (
              <div className="bg-gray-50 rounded p-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="font-medium text-gray-700 mb-2">Current Content</div>
                    <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {currentContent.slice(0, 200)}
                        {currentContent.length > 200 && '...'}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700 mb-2">Auto-saved Content</div>
                    <div className="bg-yellow-50 p-2 rounded border max-h-32 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">
                        {autoSavedContent.slice(0, 200)}
                        {autoSavedContent.length > 200 && '...'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={onRecover}
              className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
            >
              Recover Auto-saved
            </button>
            <button
              onClick={onDiscard}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Keep Current
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Decide later
          </button>
        </div>
      </div>
    </div>
  );
}