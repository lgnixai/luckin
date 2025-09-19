import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { useDocuments } from '@/stores/documents';
import type { editor } from 'monaco-editor';
import { KeyMod, KeyCode } from 'monaco-editor';

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
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyK, () => {
      // Ctrl/Cmd + K: 快速搜索
      editor.trigger('', 'actions.find', {});
    });

    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyD, () => {
      // Ctrl/Cmd + D: 选择下一个相同的词
      editor.trigger('', 'editor.action.addSelectionToNextFindMatch', {});
    });

    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP, () => {
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
      莾桭
    </div>
  );
};

export default Editor;