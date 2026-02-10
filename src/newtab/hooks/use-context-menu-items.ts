import { useMemo } from "react";
import type { ContextMenuTarget } from "@/newtab/types";
import type { ContextMenuItem } from "@/newtab/components/context-menu";
import type { LayoutState, BookmarkNode } from "@/shared/types";
import { writeLayoutState } from "@/lib/storage";
import type { ClipboardItem } from "@/hooks/use-clipboard";

type UseContextMenuItemsParams = {
  contextMenu: { target: ContextMenuTarget } | null;
  layout: LayoutState;
  layoutRef: React.RefObject<LayoutState>;
  setLayout: React.Dispatch<React.SetStateAction<LayoutState>>;
  closeContextMenu: () => void;
  navigateToFolder: (id: string | null) => Promise<void>;
  setEditTarget: (target: ContextMenuTarget | null) => void;
  setDeleteTarget: (target: Extract<ContextMenuTarget, { kind: "bookmark" }> | null) => void;
  setEditServerError: (err: string | null) => void;
  setDeleteServerError: (err: string | null) => void;
  // 剪切板相关
  tree: BookmarkNode[];
  clipboardItem: ClipboardItem | null;
  handleCut: (id: string, title: string, type: "bookmark" | "folder", parentId: string) => void;
  handleCopy: (id: string, title: string, type: "bookmark" | "folder", parentId: string) => void;
  handlePaste: (targetParentId: string, targetIndex?: number) => Promise<{ success: boolean; error?: string }>;
};

export function useContextMenuItems({
  contextMenu,
  layout,
  layoutRef,
  setLayout,
  closeContextMenu,
  navigateToFolder,
  setEditTarget,
  setDeleteTarget,
  setEditServerError,
  setDeleteServerError,
  tree,
  clipboardItem,
  handleCut,
  handleCopy,
  handlePaste
}: UseContextMenuItemsParams): ContextMenuItem[] {
  return useMemo(() => {
    if (!contextMenu) {
      return [];
    }

    const t = contextMenu.target;

    // 辅助函数：查找节点的父ID
    const findParentId = (nodeId: string): string | null => {
      const findInTree = (nodes: BookmarkNode[]): string | null => {
        for (const node of nodes) {
          if (node.children) {
            if (node.children.some(child => child.id === nodeId)) {
              return node.id;
            }
            const result = findInTree(node.children);
            if (result) return result;
          }
        }
        return null;
      };
      return findInTree(tree);
    };

    // 辅助函数：检查是否形成循环引用（将文件夹粘贴到自身内部）
    const wouldCreateCycle = (sourceId: string, targetId: string): boolean => {
      const findAncestors = (nodeId: string): string[] => {
        const ancestors: string[] = [];
        let currentId: string | null = nodeId;
        while (currentId) {
          ancestors.push(currentId);
          currentId = findParentId(currentId);
        }
        return ancestors;
      };
      const targetAncestors = findAncestors(targetId);
      return targetAncestors.includes(sourceId);
    };

    // 处理背景右键（粘贴到当前文件夹）
    if (t.kind === "background") {
      const targetFolderId = t.currentFolderId ?? "1"; // "1" 通常是书签栏的根ID
      const canPaste = clipboardItem !== null;
      const wouldCycle = clipboardItem?.type === "folder" && wouldCreateCycle(clipboardItem.id, targetFolderId);

      return [
        {
          key: "paste",
          label: "粘贴",
          disabled: !canPaste || wouldCycle,
          onSelect: () => {
            void (async () => {
              if (!clipboardItem) return;
              const result = await handlePaste(targetFolderId);
              if (!result.success && result.error) {
                alert(`粘贴失败: ${result.error}`);
              }
              closeContextMenu();
            })();
          }
        }
      ];
    }

    // 处理文件夹右键
    if (t.kind === "folder") {
      const isStartup = layout.startupFolderId === t.id;
      const parentId = findParentId(t.id);
      const canPaste = clipboardItem !== null;
      const wouldCycle = clipboardItem?.type === "folder" && wouldCreateCycle(clipboardItem.id, t.id);

      return [
        {
          key: "cut",
          label: "剪切",
          onSelect: () => {
            if (parentId) {
              handleCut(t.id, t.title, "folder", parentId);
            }
            closeContextMenu();
          }
        },
        {
          key: "copy",
          label: "复制",
          onSelect: () => {
            if (parentId) {
              handleCopy(t.id, t.title, "folder", parentId);
            }
            closeContextMenu();
          }
        },
        {
          key: "paste",
          label: "粘贴到此文件夹",
          disabled: !canPaste || wouldCycle,
          onSelect: () => {
            void (async () => {
              if (!clipboardItem) return;
              const result = await handlePaste(t.id);
              if (!result.success && result.error) {
                alert(`粘贴失败: ${result.error}`);
              }
              closeContextMenu();
            })();
          }
        },
        {
          key: "divider-1",
          label: "-",
          onSelect: () => undefined
        },
        {
          key: "startup",
          label: isStartup ? "取消启动文件夹" : "设为启动文件夹",
          onSelect: () => {
            void (async () => {
              if (!layoutRef.current) return;
              const next = {
                ...layoutRef.current,
                startupFolderId: isStartup ? null : t.id,
                lastOpenFolder: isStartup ? layoutRef.current.lastOpenFolder : t.id
              };
              setLayout(next);
              await writeLayoutState(next);
              closeContextMenu();
              if (!isStartup) {
                await navigateToFolder(t.id);
              }
            })();
          }
        },
        {
          key: "edit",
          label: "重命名...",
          onSelect: () => {
            setEditServerError(null);
            setEditTarget(t);
            closeContextMenu();
          }
        },
        {
          key: "delete",
          label: "删除文件夹（暂不支持）",
          disabled: true,
          danger: true,
          onSelect: () => undefined
        }
      ];
    }

    // 处理书签右键
    if (t.kind !== "bookmark") {
      return [];
    }
    
    const parentId = findParentId(t.id);
    return [
      {
        key: "cut",
        label: "剪切",
        onSelect: () => {
          if (parentId) {
            handleCut(t.id, t.title, "bookmark", parentId);
          }
          closeContextMenu();
        }
      },
      {
        key: "copy",
        label: "复制",
        onSelect: () => {
          if (parentId) {
            handleCopy(t.id, t.title, "bookmark", parentId);
          }
          closeContextMenu();
        }
      },
      {
        key: "divider-1",
        label: "-",
        onSelect: () => undefined
      },
      {
        key: "open-new-tab",
        label: "在新标签页打开",
        onSelect: () => {
          if (t.url) {
            window.open(t.url, "_blank", "noopener,noreferrer");
          }
          closeContextMenu();
        }
      },
      {
        key: "open-current-tab",
        label: "在当前标签页打开",
        onSelect: () => {
          if (t.url) {
            window.location.href = t.url;
          }
          closeContextMenu();
        }
      },
      {
        key: "edit",
        label: "编辑...",
        onSelect: () => {
          setEditServerError(null);
          setEditTarget(t);
          closeContextMenu();
        }
      },
      {
        key: "delete",
        label: "删除...",
        danger: true,
        onSelect: () => {
          setDeleteServerError(null);
          setDeleteTarget(t);
          closeContextMenu();
        }
      }
    ];
  }, [
    contextMenu,
    closeContextMenu,
    navigateToFolder,
    layout.startupFolderId,
    layoutRef,
    setLayout,
    setEditTarget,
    setDeleteTarget,
    setEditServerError,
    setDeleteServerError,
    tree,
    clipboardItem,
    handleCut,
    handleCopy,
    handlePaste
  ]);
}
