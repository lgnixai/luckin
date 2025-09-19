import { useCallback } from 'react';
import { useFileTree } from '@/stores/filetree';
import { useDocuments } from '@/stores/documents';

export function useObsidianFeatures() {
  const { rootId, createFile, nodesById } = useFileTree();
  const { createDocument, getDocument } = useDocuments();

  // 创建快速笔记
  const createQuickNote = useCallback((title?: string) => {
    const now = new Date();
    const defaultTitle = title || `快速笔记 ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `${defaultTitle}.md`;
    
    const content = `# ${defaultTitle}

创建时间: ${now.toLocaleString()}

---

`;
    
    const documentId = createDocument(fileName, {
      content,
      language: 'markdown'
    });
    
    const fileId = createFile(rootId, fileName, documentId);
    
    return { fileId, documentId, title: fileName };
  }, [rootId, createFile, createDocument]);

  // 创建日记
  const createDailyNote = useCallback(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `日记 ${dateStr}.md`;
    
    // 检查是否已存在今日日记
    const existingFile = Object.values(nodesById).find(
      node => node.type === 'file' && node.name === fileName
    );
    
    if (existingFile) {
      return { 
        fileId: existingFile.id, 
        documentId: existingFile.documentId, 
        title: fileName,
        isExisting: true 
      };
    }
    
    const content = `# ${dateStr} 日记

## 今日计划
- [ ] 

## 今日总结


## 随想


---
*创建于 ${now.toLocaleString()}*
`;
    
    const documentId = createDocument(fileName, {
      content,
      language: 'markdown'
    });
    
    const fileId = createFile(rootId, fileName, documentId);
    
    return { fileId, documentId, title: fileName, isExisting: false };
  }, [rootId, createFile, createDocument, nodesById]);

  // 解析文档中的链接（Obsidian风格的 [[链接]]）
  const parseDocumentLinks = useCallback((content: string) => {
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[1]);
    }
    
    return links;
  }, []);

  // 查找反向链接（哪些文档链接到了当前文档）
  const findBacklinks = useCallback((targetFileName: string) => {
    const backlinks: Array<{ fileId: string; fileName: string; documentId?: string }> = [];
    
    Object.values(nodesById).forEach(node => {
      if (node.type === 'file' && node.documentId) {
        const doc = getDocument(node.documentId);
        if (doc && doc.content) {
          const links = parseDocumentLinks(doc.content);
          if (links.some(link => link === targetFileName || link === targetFileName.replace('.md', ''))) {
            backlinks.push({
              fileId: node.id,
              fileName: node.name,
              documentId: node.documentId
            });
          }
        }
      }
    });
    
    return backlinks;
  }, [nodesById, getDocument, parseDocumentLinks]);

  // 创建模板
  const createFromTemplate = useCallback((templateName: string, fileName: string) => {
    const templates: Record<string, string> = {
      'meeting': `# 会议纪要

**时间**: ${new Date().toLocaleString()}
**参与者**: 

## 议题


## 决议


## 行动项
- [ ] 

---
`,
      'project': `# 项目: ${fileName.replace('.md', '')}

## 项目概述


## 目标


## 里程碑
- [ ] 

## 资源


## 风险


---
*创建时间: ${new Date().toLocaleString()}*
`,
      'reading': `# 读书笔记: ${fileName.replace('.md', '')}

**作者**: 
**出版年份**: 
**阅读日期**: ${new Date().toLocaleDateString()}

## 核心观点


## 重要摘录


## 个人思考


## 相关链接


---
`,
    };
    
    const content = templates[templateName] || `# ${fileName.replace('.md', '')}\n\n`;
    
    const documentId = createDocument(fileName, {
      content,
      language: 'markdown'
    });
    
    const fileId = createFile(rootId, fileName, documentId);
    
    return { fileId, documentId, title: fileName };
  }, [rootId, createFile, createDocument]);

  return {
    createQuickNote,
    createDailyNote,
    parseDocumentLinks,
    findBacklinks,
    createFromTemplate
  };
}