import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface SearchResultItem {
  id: string;
  filePath: string;
  line: number;
  column: number;
  preview: string;
}

export interface SearchState {
  query: string;
  isRegex: boolean;
  isCaseSensitive: boolean;
  include: string;
  exclude: string;
  results: SearchResultItem[];
  searching: boolean;
}

interface SearchServiceState extends SearchState {
  setQuery: (q: string) => void;
  setRegex: (v: boolean) => void;
  setCaseSensitive: (v: boolean) => void;
  setInclude: (v: string) => void;
  setExclude: (v: string) => void;
  runSearch: () => Promise<void>;
  clearResults: () => void;
}

export const useSearchService = create<SearchServiceState>()(
  immer((set, get) => ({
    query: '',
    isRegex: false,
    isCaseSensitive: false,
    include: '',
    exclude: '',
    results: [],
    searching: false,

    setQuery: (q) => set((s) => { s.query = q; }),
    setRegex: (v) => set((s) => { s.isRegex = v; }),
    setCaseSensitive: (v) => set((s) => { s.isCaseSensitive = v; }),
    setInclude: (v) => set((s) => { s.include = v; }),
    setExclude: (v) => set((s) => { s.exclude = v; }),

    runSearch: async () => {
      const { query } = get();
      if (!query) {
        set((s) => { s.results = []; });
        return;
      }
      set((s) => { s.searching = true; });
      // 占位：模拟结果
      await new Promise((r) => setTimeout(r, 200));
      set((s) => {
        s.results = [
          { id: 'r1', filePath: '/src/example.ts', line: 12, column: 3, preview: `... ${query} ...` },
          { id: 'r2', filePath: '/README.md', line: 42, column: 1, preview: `... ${query} ...` },
        ];
        s.searching = false;
      });
    },

    clearResults: () => set((s) => { s.results = []; }),
  }))
);


