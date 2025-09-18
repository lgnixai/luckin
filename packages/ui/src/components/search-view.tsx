import React from 'react';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/checkbox";
import { useSearchService } from '@lgnixai/luckin-core-legacy';

export interface SearchViewProps {
  className?: string;
}

export const SearchView: React.FC<SearchViewProps> = ({ className }) => {
  const {
    query,
    isRegex,
    isCaseSensitive,
    include,
    exclude,
    results,
    searching,
    setQuery,
    setRegex,
    setCaseSensitive,
    setInclude,
    setExclude,
    runSearch,
    clearResults,
  } = useSearchService();

  return (
    <div className={cn('p-3 space-y-3', className)}>
      <div className="space-y-2">
        <Input
          placeholder="搜索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            <Checkbox checked={isRegex} onCheckedChange={(v) => setRegex(Boolean(v))} />
            正则表达式
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={isCaseSensitive} onCheckedChange={(v) => setCaseSensitive(Boolean(v))} />
            区分大小写
          </label>
        </div>
        <Input
          placeholder="包括（如 src/**）"
          value={include}
          onChange={(e) => setInclude(e.target.value)}
        />
        <Input
          placeholder="排除（如 node_modules/**）"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={runSearch} disabled={searching}>
            {searching ? '搜索中...' : '搜索'}
          </Button>
          <Button variant="secondary" onClick={clearResults}>清除</Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">{results.length} 个结果</div>

      <div className="space-y-2 overflow-auto max-h-[60vh]">
        {results.map((r) => (
          <div key={r.id} className="p-2 rounded border hover:bg-accent">
            <div className="text-sm">{r.filePath}:{r.line}:{r.column}</div>
            <div className="text-xs text-muted-foreground truncate">{r.preview}</div>
          </div>
        ))}
      </div>
    </div>
  );
};


