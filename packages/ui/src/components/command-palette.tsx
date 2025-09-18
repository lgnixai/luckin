import React from 'react';
import { useCommandService } from '@lginxai/luckin-core-legacy';
import { cn } from "@/lib/utils";

export interface CommandPaletteProps { className?: string }

export const CommandPalette: React.FC<CommandPaletteProps> = ({ className }) => {
  const { paletteOpen, commands, execute, togglePalette } = useCommandService();

  if (!paletteOpen) return null;

  return (
    <div className={cn('fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-24', className)} onClick={() => togglePalette(false)}>
      <div className="w-[560px] rounded-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-background border-b px-3 py-2 text-sm">命令面板</div>
        <div className="bg-background max-h-80 overflow-auto">
          {commands.map((cmd: any) => (
            <button
              key={cmd.id}
              className="w-full text-left px-3 py-2 hover:bg-accent"
              onClick={async () => { await execute(cmd.id); togglePalette(false); }}
            >
              {cmd.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}


