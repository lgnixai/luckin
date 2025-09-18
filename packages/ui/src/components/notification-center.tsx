import React from 'react';
import { cn } from "@/lib/utils";
import { useNotificationService } from '@lgnixai/luckin-core';
import { Button } from '@/components/ui/button';
import { X, Bell } from 'lucide-react';

export interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const { notifications, removeNotification, clear } = useNotificationService();

  const getTypeClass = (type?: string) => {
    switch (type) {
      case 'success':
        return 'border-green-600/50 bg-green-600/10 text-green-400';
      case 'warning':
        return 'border-yellow-600/50 bg-yellow-600/10 text-yellow-400';
      case 'error':
        return 'border-red-600/50 bg-red-600/10 text-red-400';
      default:
        return 'border-blue-600/50 bg-blue-600/10 text-blue-400';
    }
  };

  return (
    <div className={cn('p-3 space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4" />
          通知中心
        </div>
        <Button variant="secondary" size="sm" onClick={clear}>清空</Button>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 && (
          <div className="text-xs text-muted-foreground">暂无通知</div>
        )}
        {notifications.map((n: any) => (
          <div
            key={n.id}
            className={cn('rounded border p-2 flex items-start justify-between', getTypeClass(n.type))}
          >
            <div className="pr-2 text-sm">{n.value}</div>
            <button className="p-1 hover:opacity-80" onClick={() => removeNotification(n.id)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


