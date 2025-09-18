import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { useDocuments } from '@/stores/documents';
import type { editor } from 'monaco-editor';

interface EditorProps {
  className?: string;
  documentId?: string;
  fallbackLanguage?: string;
  fallbackValue?: string;
}

const Editor: React.FC<EditorProps> = ({ 
  className,
  documentId,
  fallbackLanguage = 'markdown',
  fallbackValue = ''
}) => {
  const { getDocument, updateDocumentContent } = useDocuments();
  const doc = useMemo(() => getDocument(documentId), [getDocument, documentId]);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isVimMode, setIsVimMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const handleChange = useCallback((val?: string) => {
    if (doc?.id) {
      updateDocumentContent(doc.id, val ?? '');
      // 更新字数统计
      const text = val ?? '';
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [doc?.id, updateDocumentContent]);

  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    
    // 添加自定义快捷键
    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyCode.KeyK, () => {
      // Ctrl/Cmd + K: 快速搜索
      editor.trigger('', 'actions.find', {});
    });

    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyCode.KeyD, () => {
      // Ctrl/Cmd + D: 选择下一个相同的词
      editor.trigger('', 'editor.action.addSelectionToNextFindMatch', {});
    });

    editor.addCommand(editor.KeyMod.CtrlCmd | editor.KeyMod.Shift | editor.KeyCode.KeyP, () => {
      // Ctrl/Cmd + Shift + P: 命令面板
      editor.trigger('', 'editor.action.quickCommand', {});
    });

    // 监听光标位置变化
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column
      });
    });

    // 初始字数统计
    const initialText = editor.getValue();
    const words = initialText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, []);

  // Obsidian风格的编辑器配置
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    wordWrap: 'on',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Monaco, "Courier New", monospace',
    lineHeight: 1.6,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    renderWhitespace: 'selection',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: true,
    folding: true,
    showFoldingControls: 'always',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    suggest: {
      showKeywords: true,
      showSnippets: true
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true
    },
    // 启用多光标支持
    multiCursorModifier: 'ctrlCmd',
    multiCursorMergeOverlapping: true,
    // 自动保存
    formatOnPaste: true,
    formatOnType: true,
    // 代码折叠
    foldingStrategy: 'indentation',
    // 智能选择
    selectOnLineNumbers: true,
    // 滚动条样式
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false
    }
  };

  return (
    <div className={cn("flex flex-col min-h-0 h-full bg-card", className)}>
      {/* 编辑器主体 */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          value={doc?.content ?? fallbackValue}
          defaultValue={fallbackValue || '# 新标签页\n\n开始编辑您的文档...'}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          language={doc?.language ?? fallbackLanguage}
          theme="vs-dark"
          options={editorOptions}
          loading={
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span className="text-sm">正在加载编辑器...</span>
              </div>
            </div>
          }
          height="100%"
          width="100%"
        />
      </div>
      
      {/* 状态栏 */}
      <div className="flex items-center justify-between px-3 py-1 bg-muted/30 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>第 {cursorPosition.line} 行，第 {cursorPosition.column} 列</span>
          <span>{wordCount} 词</span>
          <span>{doc?.language ?? fallbackLanguage}</span>
        </div>
        <div className="flex items-center gap-2">
          {doc?.isDirty && (
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
              未保存
            </span>
          )}
          <button
            className="px-2 py-0.5 rounded text-xs hover:bg-accent transition-colors"
            onClick={() => setIsVimMode(!isVimMode)}
          >
            {isVimMode ? 'Vim' : 'Normal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Editor;