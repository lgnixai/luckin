import { useCallback, useEffect } from 'react';
import { useFileTree } from '@/stores/filetree';
import { useDocuments } from '@/stores/documents';

interface OpenDocumentInEditorParams {
  documentId: string;
  title: string;
  filePath?: string;
}

// 这个hook用于处理文件树与编辑器的双向关联
export function useFileTreeEditorIntegration() {
  const { rootId, nodesById, createFile, setDocumentId } = useFileTree();
  const { createDocument, getDocument } = useDocuments();

  // 当编辑器中新建标签页时，在文件树中创建对应的文件节点
  const createFileFromEditor = useCallback((title: string, documentId: string, parentId?: string) => {
    const targetParentId = parentId || rootId;
    const fileId = createFile(targetParentId, title, documentId);
    return fileId;
  }, [createFile, rootId]);

  // 当文件树中的文件被打开时，在编辑器中打开对应的标签页
  const openFileInEditor = useCallback((fileId: string): OpenDocumentInEditorParams | null => {
    const fileNode = nodesById[fileId];
    if (!fileNode || fileNode.type !== 'file') return null;

    // 如果文件还没有关联的文档，创建一个
    if (!fileNode.documentId) {
      const docId = createDocument(fileNode.name, {
        content: '',
        language: guessLanguageFromFileName(fileNode.name)
      });
      setDocumentId(fileId, docId);
      return {
        documentId: docId,
        title: fileNode.name,
        filePath: getFileNodePath(fileId)
      };
    }

    return {
      documentId: fileNode.documentId,
      title: fileNode.name,
      filePath: getFileNodePath(fileId)
    };
  }, [nodesById, createDocument, setDocumentId]);

  // 获取文件节点的完整路径
  const getFileNodePath = useCallback((fileId: string): string => {
    const buildPath = (nodeId: string): string[] => {
      const node = nodesById[nodeId];
      if (!node || !node.parentId) return [node?.name || ''];
      return [...buildPath(node.parentId), node.name];
    };

    const pathParts = buildPath(fileId);
    return pathParts.join('/');
  }, [nodesById]);

  return {
    createFileFromEditor,
    openFileInEditor,
    getFileNodePath
  };
}

// 辅助函数：根据文件名猜测语言
function guessLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
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
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp';
    case 'c':
      return 'c';
    case 'rs':
      return 'rust';
    case 'go':
      return 'go';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'swift':
      return 'swift';
    case 'kt':
      return 'kotlin';
    case 'scala':
      return 'scala';
    case 'sh':
      return 'shell';
    case 'yml':
    case 'yaml':
      return 'yaml';
    case 'xml':
      return 'xml';
    case 'sql':
      return 'sql';
    default:
      return 'plaintext';
  }
}