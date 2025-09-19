import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ToastNotification {
  id: string;
  title?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number; // 毫秒，默认2000ms
  timestamp: number;
}

interface ToastState {
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

export const useToastStore = create<ToastState>()(
  immer((set) => ({
    toasts: [],
    addToast: (toast) =>
      set((state) => {
        const newToast: ToastNotification = {
          ...toast,
          id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          duration: toast.duration || 2000
        };
        state.toasts.push(newToast);
      }),
    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter(t => t.id !== id);
      }),
    clearAllToasts: () =>
      set((state) => {
        state.toasts = [];
      }),
  }))
);

const ToastItem: React.FC<{
  toast: ToastNotification;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 自动关闭
    const timer = setTimeout(() => {
      handleClose();
    }, toast.duration || 2000);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // 等待退场动画完成
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800 shadow-green-100';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800 shadow-red-100';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800 shadow-yellow-100';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800 shadow-blue-100';
    }
  };

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'transition-all duration-300 ease-in-out transform',
        'max-w-sm min-w-[320px]',
        getTypeClasses(),
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95',
        isLeaving && 'translate-x-full opacity-0 scale-95'
      )}
      style={{
        animation: isVisible && !isLeaving 
          ? 'slideInRight 0.3s ease-out' 
          : isLeaving 
          ? 'slideOutRight 0.3s ease-in' 
          : undefined
      }}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="text-sm font-semibold mb-1 truncate">
            {toast.title}
          </h4>
        )}
        <p className="text-sm leading-relaxed">
          {toast.message}
        </p>
      </div>
      
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
        aria-label="关闭通知"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
      
      <div
        className="fixed bottom-4 right-4 z-[9999] space-y-3 pointer-events-none"
        style={{ 
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto'
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem
              toast={toast}
              onRemove={removeToast}
            />
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastContainer;
