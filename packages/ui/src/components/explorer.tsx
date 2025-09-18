import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';
import type { ITreeNode } from '@lgnixai/luckin-types';
import { ContextMenu } from "@/components/context-menu";
import { useEditorService } from '@lgnixai/luckin-core';

export interface ExplorerProps {
  className?: string;
}

type FileNode = ITreeNode<{ fileType: 'Folder' | 'File'; name: string }>;

interface TreeNodeProps {
  node: FileNode;
  level: number;
  expanded: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  selectedId?: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  expanded, 
  onToggle, 
  onSelect, 
  selectedId 
}) => {
  const isSelected = selectedId === node.key;
  const isFolder = node.data?.fileType === 'Folder';
  const hasChildren = !!(node.children && node.children.length > 0);
  const name = node.data?.name ?? String(node.title);

  const handleClick = () => {
    if (isFolder) {
      onToggle(node.key);
    }
    onSelect(node.key);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center py-1 px-2 cursor-pointer hover:bg-accent rounded-sm",
          isSelected && "bg-accent",
          level > 0 && "ml-4"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <Button
            variant="ghost"
            size="icon"
            className="w-4 h-4 p-0 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.key);
            }}
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </Button>
        )}
        
        {!isFolder && <div className="w-4 mr-1" />}
        
        {isFolder ? (
          expanded ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          )
        ) : (
          <File className="w-4 h-4 mr-2 text-gray-500" />
        )}
        
        <span className="text-sm truncate">{name}</span>
      </div>
      
      {isFolder && expanded && hasChildren && (
        <div>
          {node.children!.map((child: FileNode) => (
            <TreeNode
              key={child.key}
              node={child}
              level={level + 1}
              expanded={false}
              onToggle={onToggle}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Explorer: React.FC<ExplorerProps> = ({ className }) => {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = React.useState<string>();
  const [menuPos, setMenuPos] = React.useState<{x: number; y: number} | null>(null);
  const [menuItems, setMenuItems] = React.useState<{
    id: string; label: string; command?: string; onClick?: () => void
  }[]>([]);
  const { openFile } = useEditorService();

  // Mock data for now
  const mockData: FileNode[] = [
    {
      key: '1',
      title: 'src',
      data: { fileType: 'Folder', name: 'src' },
      children: [
        {
          key: '2',
          title: 'components',
          data: { fileType: 'Folder', name: 'components' },
          children: [
            {
              key: '3',
              title: 'Button.tsx',
              data: { fileType: 'File', name: 'Button.tsx' },
            },
            {
              key: '4',
              title: 'Input.tsx',
              data: { fileType: 'File', name: 'Input.tsx' },
            },
          ],
        },
        {
          key: '5',
          title: 'App.tsx',
          data: { fileType: 'File', name: 'App.tsx' },
        },
      ],
    },
    {
      key: '6',
      title: 'package.json',
      data: { fileType: 'File', name: 'package.json' },
    },
  ];

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

  const findNodeById = (nodes: FileNode[], id: string): FileNode | undefined => {
    for (const n of nodes) {
      if (n.key === id) return n;
      if (n.children) {
        const found = findNodeById(n.children as FileNode[], id);
        if (found) return found;
      }
    }
    return undefined;
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
      default:
        return 'plaintext';
    }
  };

  const defaultContentFor = (name: string): string => {
    if (name.endsWith('package.json')) {
      return '{\n  "name": "example",\n  "version": "1.0.0"\n}';
    }
    if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      return `export default function ${name.replace(/\W/g, '')}(){\n  return <div>${name}</div>;\n}`;
    }
    return `// ${name}`;
  };

  const handleSelect = async (nodeId: string) => {
    setSelectedNode(nodeId);
    const node = findNodeById(mockData, nodeId);
    if (node && node.data?.fileType === 'File') {
      const name = node.data?.name ?? String(node.title);
      const lang = guessLanguage(name);
      let content = defaultContentFor(name);
      try {
        if (name === 'package.json') {
          const res = await fetch('/package.json');
          if (res.ok) {
            content = await res.text();
          }
        }
      } catch {}
      openFile(name, content, lang);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const items = [
      { id: 'open', label: '打开', command: 'file.open' },
      { id: 'reveal', label: '在资源管理器中显示', command: 'file.reveal' },
      { id: 'rename', label: '重命名', command: 'file.rename' },
      { id: 'delete', label: '删除', command: 'file.delete' },
    ];
    setMenuItems(items);
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeMenu = () => setMenuPos(null);

  return (
    <div className={cn("flex flex-col h-full", className)} onContextMenu={handleContextMenu}>
      <div className="p-2 border-b">
        <div className="flex items-center gap-2 text-sm">
          <button className="px-2 py-0.5 rounded border bg-background">资源</button>
          <button className="px-2 py-0.5 rounded border bg-background">编辑器</button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-2">
        {/* 打开的编辑器 */}
        <div className="mb-2">
          <div className="flex items-center text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <span className="mr-1">&gt;</span>
            <span>打开的编辑器</span>
          </div>
        </div>
        
        {/* NO OPEN FOLDER */}
        <div className="mb-2">
          <div className="flex items-center text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            <span className="mr-1">&gt;</span>
            <span>NO OPEN FOLDER</span>
          </div>
        </div>
        
        {/* 原有的文件树 */}
        {mockData.map((node) => (
          <TreeNode
            key={node.key}
            node={node}
            level={0}
            expanded={expandedNodes.has(node.key)}
            onToggle={handleToggle}
            onSelect={handleSelect}
            selectedId={selectedNode}
          />
        ))}

      </div>
      {menuPos && (
        <ContextMenu items={menuItems} onClose={closeMenu} position={menuPos} />)
      }
    </div>
  );
};
