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
        next.delete(id);
      } else {
        next.add(id);
      }

      // 如果开启了持久化，同步保存到 layout
      if (layout.keepFolderExpansion) {
        // 使用 next 而不是 prev 来确保最新状态
        // 注意：这里我们不能直接调用 setLayout，因为这会导致重渲染循环或依赖问题
        // 但我们需要更新 storage。
        // 为了保持 UI 响应快，我们先更新 storage，再更新 React 状态（如果需要）
        // 这里选择只更新 storage 和 layout 状态。
        
        const nextArray = Array.from(next);
        
        // 异步更新 LayoutState，避免阻塞交互
        // 使用 setTimeout 将其放入下一个 tick，或者直接更新
        // 为了安全起见，我们在 setExpandedIds 外部调用 setLayout
        // 但 setExpandedIds 是 reducer 风格。
        // 所以我们可以在外部用 useEffect 监听 expandedIds 变化？
        // 不，那样会太频繁。最好在这里直接触发。
        
        // 这里的闭包问题：layout 可能是旧的。
        // 但我们只需要更新 expandedFolderIds 字段。
        
        setLayout(currentLayout => {
          const newLayout = { ...currentLayout, expandedFolderIds: nextArray };
          void writeLayoutState(newLayout);
          return newLayout;
        });
      }

      return next;
    });
  }, [layout.keepFolderExpansion, setLayout]);

  const handleFolderToggleGesture = useCallback((id: string, isOpen: boolean) => {
    if (isOpen) {
      clearFolderClickTimer();
      handleFolderClick(id);
      return;
    }

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
