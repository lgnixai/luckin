import React from 'react';
import { cn } from "@/lib/utils";

export interface WelcomePageProps {
  className?: string;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ className }) => {
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center bg-background", className)}>
      {/* Luckin Logo */}
      <div className="mb-8">
        <div className="relative">
          {/* 分子结构图 - 使用 CSS 创建类似原版的点阵效果 */}
          <div className="w-32 h-32 relative">
            {/* 中心点 */}
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-muted-foreground rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* 周围的点 */}
            <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            <div className="absolute bottom-1/4 left-1/4 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            <div className="absolute bottom-1/4 right-1/4 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            
            <div className="absolute top-1/2 left-1/6 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            <div className="absolute top-1/2 right-1/6 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            <div className="absolute top-1/6 left-1/2 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            <div className="absolute bottom-1/6 left-1/2 w-2 h-2 bg-muted-foreground/70 rounded-full"></div>
            
            {/* 连接线 */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128">
              <line x1="64" y1="64" x2="32" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="96" y2="32" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="32" y2="96" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="96" y2="96" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="21" y2="64" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="107" y2="64" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="64" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="64" y1="64" x2="64" y2="107" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Luckin Text */}
      <div className="text-center">
        <h1 className="text-4xl font-light text-foreground mb-4">Luckin</h1>
        <p className="text-muted-foreground text-lg">
          A modern Web IDE framework built with React.js and shadcn/ui
        </p>
      </div>
      
      {/* Welcome Content */}
      <div className="mt-12 max-w-2xl text-center">
        <h2 className="text-xl font-semibold text-foreground mb-4">Welcome to Luckin 3.x</h2>
        <div className="text-muted-foreground space-y-2">
          <p>This is a completely rewritten version of the Luckin IDE framework.</p>
          <p>Built with modern technologies:</p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">React 18</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">TypeScript 5.x</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">shadcn/ui</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Tailwind CSS</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Vite</span>
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">Zustand</span>
          </div>
        </div>
      </div>
    </div>
  );
};

