// Netscape Bookmark HTML 格式导出
import type { BookmarkNode, ExportHtmlOptions } from "@/shared/types";

// HTML 特殊字符转义
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

// 递归生成书签 HTML
const generateBookmarkHtml = (nodes: BookmarkNode[], indent: number = 1): string => {
  const spaces = "    ".repeat(indent);
  let html = "";

  for (const node of nodes) {
    const addDate = node.dateAdded ? Math.floor(node.dateAdded / 1000) : "";

    if (node.children) {
      // 文件夹
      html += `${spaces}<DT><H3 ADD_DATE="${addDate}">${escapeHtml(node.title)}</H3>\n`;
      html += `${spaces}<DL><p>\n`;
      html += generateBookmarkHtml(node.children, indent + 1);
      html += `${spaces}</DL><p>\n`;
    } else if (node.url) {
      // 书签
      html += `${spaces}<DT><A HREF="${escapeHtml(node.url)}" ADD_DATE="${addDate}">${escapeHtml(node.title)}</A>\n`;
    }
  }

  return html;
};

// 在树中查找指定 ID 的节点
const findNodeById = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

/**
 * 导出书签为 Netscape Bookmark HTML 格式
 * @param tree 书签树
 * @param options 导出选项
 * @returns HTML 字符串
 */
export function exportBookmarksToHtml(tree: BookmarkNode[], options?: ExportHtmlOptions): string {
  let nodesToExport: BookmarkNode[];

  if (options?.rootId) {
    const rootNode = findNodeById(tree, options.rootId);
    if (!rootNode) {
      throw new Error(`找不到指定的文件夹: ${options.rootId}`);
    }
    nodesToExport = rootNode.children ?? [];
  } else {
    // 导出全部：跳过根节点，直接导出其 children
    nodesToExport = tree[0]?.children ?? [];
  }

  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  const footer = `</DL><p>
`;

  return header + generateBookmarkHtml(nodesToExport) + footer;
}

/**
 * 触发浏览器下载文件
 * @param content 文件内容
 * @param filename 文件名
 * @param mimeType MIME 类型
 */
export function downloadFile(content: string, filename: string, mimeType: string = "text/html"): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
