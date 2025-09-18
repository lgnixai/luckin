import React, { useMemo, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2, Pencil, FilePlus2, FolderPlus } from 'lucide-react';
import { ContextMenu } from "@/components/context-menu";
import { useDocuments } from '@/stores/documents';
import { useFileTree } from '@/stores/filetree';
import { useEditorBridge } from '@/stores/editorBridge';

export interface ExplorerProps { className?: string; }

interface TreeNodeProps {
  id: string;
  level: number;
  expanded: boolean;
  onToggle: (nodeId: string) => void;
  onSelect: (nodeId: string) => void;
  selectedId?: string | null;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
  onMove: (fromId: string, toFolderId: string) => void;
  renamingId: string | null;
  tempName: string;
  setTempName: (name: string) => void;
  commitRename: () => void;
  beginRename: (id: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ id, level, expanded, onToggle, onSelect, selectedId, onContextMenu, onMove, renamingId, tempName, setTempName, commitRename, beginRename }) => {
  const { nodesById, listChildren } = useFileTree();
  const node = nodesById[id];
  if (!node) return null;
  const isSelected = selectedId === id;
  const isFolder = node.type === 'folder';
  const hasChildren = (node.children?.length || 0) > 0;
  const name = node.name;

  const handleClick = () => {
    if (isFolder) onToggle(id);
    onSelect(id);
  };

  return (
    <div onContextMenu={(e) => onContextMenu(e, id)} draggable onDragStart={(e) => { e.dataTransfer.setData('text/tree-id', id); }} onDragOver={(e) => { if (isFolder) e.preventDefault(); }} onDrop={(e) => { if (!isFolder) return; const moving = e.dataTransfer.getData('text/tree-id'); if (moving && moving !== id) { onMove(moving, id); onSelect(id); onToggle(id); } }}>
      <div
        className={cn(
          "flex items-center py-1 px-2 cursor-pointer hover:bg-accent rounded-sm",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
          <Button variant="ghost" size="icon" className="w-4 h-4 p-0 mr-1" onClick={(e) => { e.stopPropagation(); onToggle(id); }}>
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </Button>
        ) : (
          <div className="w-4 mr-1" />
        )}
        {isFolder ? (
          expanded ? <FolderOpen className="w-4 h-4 mr-2 text-blue-500" /> : <Folder className="w-4 h-4 mr-2 text-blue-500" />
        ) : (
          <File className="w-4 h-4 mr-2 text-gray-500" />
        )}
        {renamingId === id ? (
          <input
            className="flex-1 text-sm bg-transparent border rounded px-1 py-0.5 outline-none"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') beginRename(''); }}
            autoFocus
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm truncate">{name}</span>
        )}
      </div>
      {isFolder && expanded && hasChildren && (
        <div>
          {(listChildren(id)).map((child) => (
            <TreeNode key={child.id} id={child.id} level={level + 1} expanded={false} onToggle={onToggle} onSelect={onSelect} selectedId={selectedId} onContextMenu={onContextMenu} onMove={onMove} renamingId={renamingId} tempName={tempName} setTempName={setTempName} commitRename={commitRename} beginRename={beginRename} />
          ))}
        </div>
      )}
    </div>
  );
};

export const Explorer: React.FC<ExplorerProps> = ({ className }) => {
  const { rootId, listChildren, createFile, createFolder, renameNode, deleteNode, moveNode, nodesById, selectedId, setSelectedId, setCurrentFolderId, getPath, linkDocument } = useFileTree();
  const { createDocument } = useDocuments();
  const { openDocument } = useEditorBridge();

  const [expanded, setExpanded] = useState<Set<string>>(new Set([rootId]));
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [menuItems, setMenuItems] = useState<{ id: string; label: string; onClick?: () => void }[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const toggle = (id: string) => setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const select = (id: string) => { setSelectedId(id); const n = nodesById[id]; if (n?.type === 'folder') setCurrentFolderId(id); if (n?.type === 'file' && n.documentId) openDocument(n.documentId, n.name, getPath(id)); };

  const ensureOpen = useCallback((id: string) => { if (!expanded.has(id)) setExpanded(new Set([...expanded, id])); }, [expanded]);

  const onOpenFile = (id: string) => {
    const node = nodesById[id];
    if (!node || node.type !== 'file') return;
    if (node.documentId) { openDocument(node.documentId, node.name, getPath(id)); return; }
    const lang = (() => { const ext = node.name.split('.').pop()?.toLowerCase(); if (ext === 'ts' || ext === 'tsx') return 'typescript'; if (ext === 'js' || ext === 'jsx') return 'javascript'; if (ext === 'json') return 'json'; if (ext === 'md') return 'markdown'; return 'plaintext'; })();
    const docId = createDocument(node.name, { content: '', language: lang, path: getPath(id) });
    linkDocument(id, docId);
    openDocument(docId, node.name, getPath(id));
  };

  const beginRename = (id: string) => { setRenamingId(id); setTempName(id ? (nodesById[id]?.name ?? '') : ''); };
  const commitRename = () => { if (!renamingId) return; renameNode(renamingId, tempName.trim() || nodesById[renamingId].name); setRenamingId(null); };

  const createFileHere = (parentId: string) => { const fileId = createFile(parentId); ensureOpen(parentId); setRenamingId(fileId); setTempName(nodesById[fileId]?.name ?? '未命名.md'); };
  const createFolderHere = (parentId: string) => { const folderId = createFolder(parentId); ensureOpen(parentId); setRenamingId(folderId); setTempName(nodesById[folderId]?.name ?? '新建文件夹'); };

  const onContext = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const node = nodesById[id];
    const items: { id: string; label: string; onClick?: () => void }[] = [];
    if (!node) return;
    if (node.type === 'folder') {
      items.push({ id: 'new-file', label: '新建文件', onClick: () => createFileHere(id) });
      items.push({ id: 'new-folder', label: '新建文件夹', onClick: () => createFolderHere(id) });
    } else {
      items.push({ id: 'open', label: '打开', onClick: () => onOpenFile(id) });
    }
    items.push({ id: 'rename', label: '重命名', onClick: () => beginRename(id) });
    items.push({ id: 'delete', label: '删除', onClick: () => deleteNode(id) });
    setMenuItems(items);
    setMenuPos({ x: e.clientX, y: e.clientY });
    setSelectedId(id);
  };

  const closeMenu = () => setMenuPos(null);

  const moveFromDrag = (fromId: string, toFolderId: string) => { if (fromId && toFolderId && fromId !== toFolderId) moveNode(fromId, toFolderId); };

  const tree = useMemo(() => listChildren(rootId), [listChildren, rootId, nodesById]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-2 border-b flex items-center justify-between">
        <div className="text-xs text-muted-foreground">资源管理器</div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-accent rounded" title="新建文件" onClick={() => createFileHere(selectedId && nodesById[selectedId]?.type === 'folder' ? selectedId : rootId)}>
            <FilePlus2 className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-accent rounded" title="新建文件夹" onClick={() => createFolderHere(selectedId && nodesById[selectedId]?.type === 'folder' ? selectedId : rootId)}>
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2" onContextMenu={(e) => { e.preventDefault(); setMenuItems([{ id: 'new-file', label: '新建文件', onClick: () => createFileHere(rootId) }, { id: 'new-folder', label: '新建文件夹', onClick: () => createFolderHere(rootId) }]); setMenuPos({ x: e.clientX, y: e.clientY }); }}>
        {(tree).map((child) => (
          <div key={child.id} onDoubleClick={() => (child.type === 'file' ? onOpenFile(child.id) : toggle(child.id))}>
            <TreeNode id={child.id} level={0} expanded={expanded.has(child.id)} onToggle={toggle} onSelect={select} selectedId={selectedId ?? null} onContextMenu={onContext} onMove={moveFromDrag} renamingId={renamingId} tempName={tempName} setTempName={setTempName} commitRename={commitRename} beginRename={beginRename} />
          </div>
        ))}
      </div>
      {menuPos && (<ContextMenu items={menuItems} onClose={closeMenu} position={menuPos} />)}
    </div>
  );
};
