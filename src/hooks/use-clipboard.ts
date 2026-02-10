import { useState, useCallback } from "react";
import type { BookmarkNode } from "@/shared/types";
import { copyBookmarkTree, findAncestors } from "@/lib/bookmarks";
import { applyBookmarkChange } from "@/lib/messaging";

export type ClipboardOperation = "cut" | "copy";

export type ClipboardItem = {
  id: string;
  title: string;
  type: "bookmark" | "folder";
  operation: ClipboardOperation;
  parentId: string; // 记录原父文件夹，用于剪切时的移动操作
};

export function useClipboard(bookmarkTree: BookmarkNode[]) {
  const [clipboardItem, setClipboardItem] = useState<ClipboardItem | null>(null);

  const handleCut = useCallback((id: string, title: string, type: "bookmark" | "folder", parentId: string) => {
    setClipboardItem({ id, title, type, operation: "cut", parentId });
  }, []);

  const handleCopy = useCallback((id: string, title: string, type: "bookmark" | "folder", parentId: string) => {
    setClipboardItem({ id, title, type, operation: "copy", parentId });
  }, []);

  const handlePaste = useCallback(
    async (targetParentId: string, targetIndex?: number) => {
      if (!clipboardItem) {
        return { success: false, error: "剪切板为空" };
      }

      try {
        // 检查是否嵌套（防止将文件夹移动/复制到自身内部）
        if (clipboardItem.type === "folder") {
          const ancestors = findAncestors(bookmarkTree, targetParentId);
          if (ancestors.includes(clipboardItem.id)) {
            return { success: false, error: "无法将文件夹移动/复制到自身内部" };
          }
        }

        if (clipboardItem.operation === "cut") {
          // 移动操作
          await applyBookmarkChange({
            type: "move",
            id: clipboardItem.id,
            parentId: targetParentId,
            index: targetIndex
          });
          // 移动完成后清空剪切板
          setClipboardItem(null);
        } else {
          // 复制操作
          if (clipboardItem.type === "bookmark") {
            // 单个书签：直接创建
            await applyBookmarkChange({
              type: "create",
              parentId: targetParentId,
              title: clipboardItem.title,
              url: getBookmarkUrl(bookmarkTree, clipboardItem.id),
              index: targetIndex
            });
          } else {
            // 文件夹：递归复制
            await copyBookmarkTree(clipboardItem.id, targetParentId, targetIndex);
          }
          // 复制操作不清空剪切板，可以多次粘贴
        }

        return { success: true };
      } catch (error) {
        console.error("粘贴失败:", error);
        return { success: false, error: error instanceof Error ? error.message : "粘贴失败" };
      }
    },
    [clipboardItem, bookmarkTree]
  );

  const clearClipboard = useCallback(() => {
    setClipboardItem(null);
  }, []);

  return {
    clipboardItem,
    handleCut,
    handleCopy,
    handlePaste,
    clearClipboard
  };
}

// 辅助函数：从书签树中获取书签的URL
function getBookmarkUrl(tree: BookmarkNode[], id: string): string | undefined {
  for (const node of tree) {
    if (node.id === id) {
      return node.url;
    }
    if (node.children) {
      const url = getBookmarkUrl(node.children, id);
      if (url !== undefined) {
        return url;
      }
    }
  }
  return undefined;
}
