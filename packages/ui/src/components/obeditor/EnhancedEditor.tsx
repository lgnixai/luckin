import React, { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Split, Code, FileText } from 'lucide-react';
import Editor from './Editor';
import MarkdownPreview from './MarkdownPreview';
import { useDocuments } from '@/stores/documents';
import { WelcomePage } from '@/components/welcome-page';
import { useFileTreeEditorIntegration } from '@/hooks/useFileTreeEditorIntegration';
import { useFileTree } from '@/stores/filetree';

interface EnhancedEditorProps {
  documentId?: string;
  className?: string;
}

type ViewMode = 'edit' | 'preview' | 'split';

const EnhancedEditor: React.FC<EnhancedEditorProps> = ({ documentId, className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const { getDocument, createDocument } = useDocuments();
  const doc = useMemo(() => getDocument(documentId), [getDocument, documentId]);
  const { createFileFromEditor, getFileNodePath } = useFileTreeEditorIntegration();
  const { nodesById } = useFileTree();
  
  const isMarkdown = doc?.language === 'markdown';
  
  // Welcome actions: new/open/recent/close
  const handleOpenOrActivate = useCallback((openDocId: string, title: string, fileId?: string) => {
    const filePath = fileId ? getFileNodePath(fileId) : undefined;
    window.dispatchEvent(new CustomEvent('file-tree-open-file', {
      detail: { documentId: openDocId, title, filePath, nodeId: fileId }
    }));
  }, [getFileNodePath]);

  const handleCreateNewFile = useCallback(() => {
    const newDocId = createDocument('未命名.md', { content: '', language: 'markdown' });
    const fileId = createFileFromEditor('未命名.md', newDocId);
    handleOpenOrActivate(newDocId, '未命名', fileId);
  }, [createDocument, createFileFromEditor, handleOpenOrActivate]);

  const handleOpenLocalFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.txt,.json,.js,.ts,.tsx,.jsx,.css,.html,.py,.java,.c,.cpp,.rs,.go,*/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const content = await file.text();
      const newDocId = createDocument(file.name, { content, language: 'markdown' });
      const fileId = createFileFromEditor(file.name, newDocId);
      handleOpenOrActivate(newDocId, file.name.replace(/\.[^/.]+$/, ''), fileId);
    };
    input.click();
  }, [createDocument, createFileFromEditor, handleOpenOrActivate]);

  const handleOpenRecent = useCallback((targetDocId: string) => {
    const target = getDocument(targetDocId);
    if (!target) return;
    const fileId = Object.values(nodesById).find(n => n.type === 'file' && n.documentId === target.id)?.id;
    handleOpenOrActivate(target.id, target.name.replace(/\.[^/.]+$/, ''), fileId);
  }, [getDocument, nodesById, handleOpenOrActivate]);

  const handleCloseActiveTab = useCallback(() => {
    window.dispatchEvent(new CustomEvent('welcome-close-active'));
  }, []);
  
  const renderContent = () => {
    switch (viewMode) {
      case 'edit':
        return (
          <div className="h-full">
            <Editor documentId={documentId} />
          </div>
        );
      
      case 'preview':
        return isMarkdown ? (
          <div className="h-full bg-card">
            <MarkdownPreview content={doc?.content || ''} />
          </div>
        ) : (
          <div className="h-full bg-card flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>预览模式仅支持 Markdown 文件</p>
            </div>
          </div>
        );
      
      case 'split':
        return isMarkdown ? (
          <div className="h-full flex">
            <div className="flex-1 border-r border-border">
              <Editor documentId={documentId} />
            </div>
            <div className="flex-1 bg-card">
              <MarkdownPreview content={doc?.content || ''} />
            </div>
          </div>
        ) : (
          <div className="h-full">
            <Editor documentId={documentId} />
          </div>
        );
      
      default:
        return (
          <div className="h-full">
            <Editor documentId={documentId} />
          </div>
        );
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {doc?.name || '未命名文档'}
          </span>
          {doc?.isDirty && (
            <div className="w-1.5 h-1.5 bg-primary rounded-full" />
          )}
        </div>
        
        {/* 视图控制按钮 */}
        {isMarkdown && (
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('edit')}
              className="h-7 px-2"
            >
              <Code className="w-3 h-3 mr-1" />
              编辑
            </Button>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('split')}
              className="h-7 px-2"
            >
              <Split className="w-3 h-3 mr-1" />
              分屏
            </Button>
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('preview')}
              className="h-7 px-2"
            >
              <Eye className="w-3 h-3 mr-1" />
              预览
            </Button>
          </div>
        )}
      </div>
      
      {/* 内容区域 */}
      <div className="flex-1 min-h-0 relative">
        {doc?.name === '新标签页' && (doc?.content ?? '') === '' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
            <WelcomePage
              className="max-w-xl"
              onNewFile={handleCreateNewFile}
              onOpenFile={handleOpenLocalFile}
              onOpenRecent={handleOpenRecent}
              onCloseTab={handleCloseActiveTab}
            />
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default EnhancedEditor;