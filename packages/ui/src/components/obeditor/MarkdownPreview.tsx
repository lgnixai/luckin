import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

// 简单的Markdown解析器（实际项目中建议使用marked或类似库）
const parseMarkdown = (content: string): string => {
  let html = content;
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*(.*)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  
  // Code inline
  html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
  
  // Code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/^\+ (.*$)/gim, '<li>$1</li>');
  
  // Wrap consecutive list items in ul tags
  html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
  
  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gims, (match) => {
    if (match.includes('<ul>')) return match;
    return `<ol>${match}</ol>`;
  });
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
  
  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr>');
  html = html.replace(/^\*\*\*$/gim, '<hr>');
  
  // Line breaks
  html = html.replace(/\n\n/gim, '</p><p>');
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs and fix nested tags
  html = html.replace(/<p><\/p>/gim, '');
  html = html.replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<ul>.*<\/ul>)<\/p>/gims, '$1');
  html = html.replace(/<p>(<ol>.*<\/ol>)<\/p>/gims, '$1');
  html = html.replace(/<p>(<blockquote>.*<\/blockquote>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<pre>.*<\/pre>)<\/p>/gims, '$1');
  
  return html;
};

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, className }) => {
  const htmlContent = useMemo(() => parseMarkdown(content), [content]);
  
  return (
    <div 
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-headings:text-foreground",
        "prose-p:text-foreground prose-p:leading-relaxed",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-strong:text-foreground prose-strong:font-semibold",
        "prose-em:text-foreground prose-em:italic",
        "prose-code:text-primary prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-md prose-pre:p-4",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground",
        "prose-ul:list-disc prose-ul:pl-6 prose-ol:list-decimal prose-ol:pl-6",
        "prose-li:text-foreground prose-li:my-1",
        "prose-hr:border-border prose-hr:my-8",
        "p-6 overflow-auto",
        className
      )}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownPreview;