import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { BookmarkNode, LayoutState } from "@/shared/types";
import { writeLayoutState } from "@/lib/storage";
import { findNodeById, getTopLevelNodes, getCardTitle, findPathInTree } from "@/newtab/utils";

export function useFolderNavigation(
  tree: BookmarkNode[],
  layout: LayoutState,
  setLayout: React.Dispatch<React.SetStateAction<LayoutState>>,
  activeFolderId: string | null,
  setActiveFolderId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const folderClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化：如果开启了保持展开状态，则从 layout 中恢复
  useEffect(() => {
    if (layout.keepFolderExpansion && layout.expandedFolderIds && layout.expandedFolderIds.length > 0) {
      // 只有当当前为空时才覆盖（或者是首次加载）
      // 这里简单处理：仅在组件挂载且 layout 有值时生效，但由于 layout 是异步加载的，
      // 我们依赖 layout 的更新。为了避免死循环，我们只在 expandedIds 为空时尝试恢复。
      setExpandedIds((prev) => {
        if (prev.size === 0) {
          return new Set(layout.expandedFolderIds);
        }
        return prev;
      });
    }
  }, [layout.keepFolderExpansion, layout.expandedFolderIds]);

  useEffect(() => {
    return () => {
      if (folderClickTimerRef.current) {
        clearTimeout(folderClickTimerRef.current);
        folderClickTimerRef.current = null;
      }
    };
  }, []);

  const rootNodes = useMemo(() => getTopLevelNodes(tree), [tree]);

  const currentFolder = useMemo(
    () => findNodeById(rootNodes, activeFolderId),
    [rootNodes, activeFolderId]
  );

  const currentNodes = currentFolder?.children ?? rootNodes;

  const fullPath = useMemo(() => {
    const root = tree[0];
    if (!root || !activeFolderId) {
      return [] as BookmarkNode[];
    }
    return findPathInTree(root, activeFolderId) ?? [];
  }, [tree, activeFolderId]);

  const breadcrumbSegments = useMemo(() => {
    const visible = fullPath.length >= 2 ? fullPath.slice(1) : [];
    return visible.map((n) => ({ id: n.id, title: getCardTitle(n) }));
  }, [fullPath]);

  const clearFolderClickTimer = useCallback(() => {
    if (folderClickTimerRef.current) {
      clearTimeout(folderClickTimerRef.current);
      folderClickTimerRef.current = null;
    }
  }, []);

  const navigateToFolder = useCallback(
    async (id: string | null) => {
      clearFolderClickTimer();
      
      // 如果没有开启保持展开状态，则切换文件夹时清空展开状态
      if (!layout.keepFolderExpansion) {
        setExpandedIds(new Set());
      }
      
      setActiveFolderId(id);
      setLayout((prev) => {
        const next = { ...prev, lastOpenFolder: id };
        void writeLayoutState(next);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearFolderClickTimer, setLayout, setActiveFolderId, layout.keepFolderExpansion]
  );

  const handleFolderClick = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        // 收起：同时级联收起所有子孙文件夹
        const node = findNodeById(rootNodes, id);
        if (node) {
          const removeDescendants = (n: BookmarkNode) => {
            next.delete(n.id);
            for (const child of n.children ?? []) {
              if (!child.url) {  // 只处理文件夹节点
                removeDescendants(child);
              }
            }
          };
          removeDescendants(node);
        }
      } else {
        // 展开：只添加当前节点
        next.add(id);
      }

      // 如果开启了持久化，同步保存到 layout
      if (layout.keepFolderExpansion) {
        const nextArray = Array.from(next);
        setLayout(currentLayout => {
          const newLayout = { ...currentLayout, expandedFolderIds: nextArray };
          void writeLayoutState(newLayout);
          return newLayout;
        });
      }

      return next;
    });
  }, [layout.keepFolderExpansion, setLayout, rootNodes]);

  const handleFolderToggleGesture = useCallback((id: string, isOpen: boolean) => {
    clearFolderClickTimer();
    folderClickTimerRef.current = setTimeout(() => {
      folderClickTimerRef.current = null;
      handleFolderClick(id);
    }, 220);
  }, [clearFolderClickTimer, handleFolderClick]);

  const handleSubFolderOpen = useCallback(async (id: string) => {
    await navigateToFolder(id);
  }, [navigateToFolder]);

  const handleBackToParent = useCallback(async () => {
    if (!activeFolderId) {
      return;
    }
    const root = tree[0];
    if (!root) {
      await navigateToFolder(null);
      return;
    }
    const path = findPathInTree(root, activeFolderId);
    if (!path || path.length < 2) {
      await navigateToFolder(null);
      return;
    }
    if (path.length === 2) {
      await navigateToFolder(null);
      return;
    }
    const parent = path[path.length - 2];
    await navigateToFolder(parent.id);
  }, [activeFolderId, tree, navigateToFolder]);

  return {
    activeFolderId,
    setActiveFolderId,
    expandedIds,
    currentFolder,
    currentNodes,
    fullPath,
    breadcrumbSegments,
    navigateToFolder,
    handleFolderClick,
    handleFolderToggleGesture,
    handleSubFolderOpen,
    handleBackToParent,
    clearFolderClickTimer
  };
}
