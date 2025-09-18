import React from 'react';
import { cn } from "@/lib/utils";
import { useCommandService } from '@lginxai/luckin-core-legacy';

export interface ContextMenuItem {
  id: string;
  label: string;
  command?: string;
  onClick?: () => void;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  onClose: () => void;
  position: { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, onClose, position }) => {
  const { execute } = useCommandService();

  React.useEffect(() => {
    const handle = () => onClose();
    window.addEventListener('click', handle);
    window.addEventListener('contextmenu', handle);
    return () => {
      window.removeEventListener('click', handle);
      window.removeEventListener('contextmenu', handle);
    };
  }, [onClose]);

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.onClick) item.onClick();
    if (item.command) execute(item.command);
    onClose();
  };

  return (
    <div
      className={cn('fixed z-50 min-w-[160px] rounded border bg-popover text-popover-foreground shadow-md')}
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          onClick={() => handleItemClick(item)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};


