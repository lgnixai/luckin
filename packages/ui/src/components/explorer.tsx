import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, MoreHorizontal, Edit, Trash2, Move, FilePlus, FolderPlus, Calendar, Zap, FileText } from 'lucide-react';
import type { ITreeNode } from '@lgnixai/luckin-types';
import { ContextMenu } from "@/components/context-menu";
import { useEditorService } from '@lgnixai/luckin-core';
import { useFileTree } from '@/stores/filetree';
import { useDocuments } from '@/stores/documents';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useFileTreeEditorIntegration } from '@/hooks/useFileTreeEditorIntegration';
import { useObsidianFeatures } from '@/hooks/useObsidianFeatures';

export interface ExplorerProps {
  className?: string;
}

interface TreeNodeProps {
  nodeId: string;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  selectedId?: string;
  onRename: (nodeId: string, newName: string) => void;
  onDelete: (nodeId: string) => void;
  onCreateFile: (parentId: string) => void;
  onCreateFolder: (parentId: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  nodeId, 
  level, 
  expandedNodes, 
  onToggle, 
  onSelect, 
  selectedId,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder
}) => {
  const { nodesById, listChildren } = useFileTree();
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [menuPos, setMenuPos] = React.useState<{x: number; y: number} | null>(null);

  const node = nodesById[nodeId];
  if (!node) return null;

  const isSelected = selectedId === nodeId;
  const isFolder = node.type === 'folder';
  const children = isFolder ? listChildren(nodeId) : [];
  const hasChildren = children.length > 0;
  const expanded = expandedNodes.has(nodeId);

  const handleClick = () => {
    if (isFolder) {
      onToggle(nodeId);
    }
    onSelect(nodeId);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setMenuPos(null);

  const handleRenameSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newName.trim()) {
      onRename(nodeId, newName.trim());
      setIsRenaming(false);
    } else if (e.key === 'Escape') {
      setIsRenaming(false);
      setNewName(node.name);
    }
  };

  const startRename = () => {
    setNewName(node.name);
    setIsRenaming(true);
    closeMenu();
  };

  const handleDeleteClick = () => {
    if (window.confirm(`确定要删除 "${node.name}" 吗？`)) {
      onDelete(nodeId);
    }
    closeMenu();
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center py-1 px-2 cursor-pointer hover:bg-accent rounded-sm relative",
          isSelected && "bg-accent",
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {isFolder && (
          <Button
            variant="ghost"
            size="icon"
            className="w-4 h-4 p-0 mr-1 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(nodeId);
            }}
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        {!isFolder && <div className="w-4 mr-1 flex-shrink-0" />}
        
        {isFolder ? (
          expanded ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
          )
        ) : (
          <File className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
        )}
        
        {isRenaming ? (
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleRenameSubmit}
            onBlur={() => setIsRenaming(false)}
            className="flex-1 text-sm bg-transparent border border-border rounded px-1 outline-none text-foreground"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm truncate flex-1">{node.name}</span>
        )}

        {/* Action buttons on hover */}
        {isFolder && !isRenaming && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-4 h-4 p-0 hover:bg-accent-hover"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateFile(nodeId); }}>
                  <FilePlus className="w-4 h-4 mr-2" />
                  新建文件
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCreateFolder(nodeId); }}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  新建文件夹
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {/* Context menu */}
      {menuPos && (
        <div className="fixed inset-0 z-50" onClick={closeMenu}>
          <div
            className="absolute bg-card border border-border shadow-dropdown rounded-md py-1 min-w-[160px] z-50"
            style={{ left: menuPos.x, top: menuPos.y }}
            onClick={(e) => e.stopPropagation()}
          >
            {isFolder && (
              <>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary flex items-center"
                  onClick={() => { onCreateFile(nodeId); closeMenu(); }}
                >
                  <FilePlus className="w-4 h-4 mr-2" />
                  新建文件
                </button>
                <button
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary flex items-center"
                  onClick={() => { onCreateFolder(nodeId); closeMenu(); }}
                >
                  <FolderPlus className="w-4 h-4 mr-2" />
                  新建文件夹
                </button>
                <div className="border-t border-border my-1" />
              </>
            )}
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary flex items-center"
              onClick={startRename}
            >
              <Edit className="w-4 h-4 mr-2" />
              重命名
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary text-red-600 flex items-center"
              onClick={handleDeleteClick}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </button>
          </div>
        </div>
      )}
      
      {isFolder && expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.id}
              nodeId={child.id}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
              onRename={onRename}
              onDelete={onDelete}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Explorer: React.FC<ExplorerProps> = ({ className }) => {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set(['root']));
  const [selectedNode, setSelectedNode] = React.useState<string>();
  const { rootId, nodesById, listChildren, createFile, createFolder, renameNode, deleteNode, setDocumentId } = useFileTree();
  const { createDocument, getDocument, renameDocument } = useDocuments();
  const { openFile } = useEditorService();
  const { openFileInEditor } = useFileTreeEditorIntegration();
  const { createQuickNote, createDailyNote, createFromTemplate } = useObsidianFeatures();

  // 确保根节点默认展开
  React.useEffect(() => {
    if (rootId) {
      setExpandedNodes(prev => new Set([...prev, rootId]));
    }
  }, [rootId]);

  const handleToggle = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const guessLanguage = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'py':
        return 'python';
      default:
        return 'plaintext';
    }
  };

  const defaultContentFor = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
        return `import React from 'react';\n\nconst ${name.replace(/\W/g, '')}: React.FC = () => {\n  return (\n    <div>\n      <h1>${name}</h1>\n    </div>\n  );\n};\n\nexport default ${name.replace(/\W/g, '')};`;
      case 'ts':
        return `// ${name}\n\nexport default function ${name.replace(/\W/g, '')}() {\n  // TODO: implement\n}`;
      case 'js':
      case 'jsx':
        return `// ${name}\n\nexport default function ${name.replace(/\W/g, '')}() {\n  // TODO: implement\n}`;
      case 'md':
        return `# ${name.replace(/\.[^/.]+$/, "")}\n\n`;
      case 'json':
        return '{\n  \n}';
      default:
        return `# ${name}\n\n`;
    }
  };

  const handleSelect = async (nodeId: string) => {
    setSelectedNode(nodeId);
    const node = nodesById[nodeId];
    if (node && node.type === 'file') {
      const fileInfo = openFileInEditor(nodeId);
      if (fileInfo) {
        const doc = getDocument(fileInfo.documentId);
        const content = doc?.content ?? defaultContentFor(node.name);
        const lang = guessLanguage(node.name);
        
        openFile(node.name, content, lang);
      }
    }
  };

  const handleRename = (nodeId: string, newName: string) => {
    const node = nodesById[nodeId];
    if (node && node.documentId) {
      // 同步更新文档名称
      renameDocument(node.documentId, newName);
    }
    renameNode(nodeId, newName);
  };

  const handleDelete = (nodeId: string) => {
    deleteNode(nodeId);
    if (selectedNode === nodeId) {
      setSelectedNode(undefined);
    }
    // 从展开节点中移除
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
  };

  const handleCreateFile = (parentId: string) => {
    const fileId = createFile(parentId, '未命名.md');
    // 确保父节点展开
    setExpandedNodes(prev => new Set([...prev, parentId]));
    // 选中新创建的文件
    setSelectedNode(fileId);
  };

  const handleCreateFolder = (parentId: string) => {
    const folderId = createFolder(parentId, '新建文件夹');
    // 确保父节点展开
    setExpandedNodes(prev => new Set([...prev, parentId]));
    // 选中新创建的文件夹
    setSelectedNode(folderId);
  };

  const rootChildren = listChildren(rootId);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-2 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">文件资源管理器</span>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleCreateFile(rootId)}>
                  <FilePlus className="w-4 h-4 mr-2" />
                  新建文件
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCreateFolder(rootId)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  新建文件夹
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const { fileId } = createQuickNote();
                  setSelectedNode(fileId);
                  setExpandedNodes(prev => new Set([...prev, rootId]));
                }}>
                  <Zap className="w-4 h-4 mr-2" />
                  快速笔记
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const { fileId } = createDailyNote();
                  setSelectedNode(fileId);
                  setExpandedNodes(prev => new Set([...prev, rootId]));
                }}>
                  <Calendar className="w-4 h-4 mr-2" />
                  今日日记
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const { fileId } = createFromTemplate('meeting', '会议纪要.md');
                  setSelectedNode(fileId);
                  setExpandedNodes(prev => new Set([...prev, rootId]));
                }}>
                  <FileText className="w-4 h-4 mr-2" />
                  会议模板
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const { fileId } = createFromTemplate('project', '新项目.md');
                  setSelectedNode(fileId);
                  setExpandedNodes(prev => new Set([...prev, rootId]));
                }}>
                  <FileText className="w-4 h-4 mr-2" />
                  项目模板
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-1">
        {/* 根文件夹 */}
        {rootId && nodesById[rootId] && (
          <TreeNode
            nodeId={rootId}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={handleToggle}
            onSelect={handleSelect}
            selectedId={selectedNode}
            onRename={handleRename}
            onDelete={handleDelete}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
          />
        )}
      </div>
    </div>
  );
};
