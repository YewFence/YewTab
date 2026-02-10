import { useCallback, useMemo, useRef, useEffect } from "react";
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
  const folderClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 根据当前上下文自动计算展开状态
  const expandedIds = useMemo(() => {
    if (!layout.keepFolderExpansion || !layout.expandedStateTree) {
      return new Set<string>();
    }

    const contextKey = activeFolderId ?? "__root__";
    const expandedList = layout.expandedStateTree[contextKey] ?? [];

    return new Set(expandedList);
  }, [layout.keepFolderExpansion, layout.expandedStateTree, activeFolderId]);

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

      setActiveFolderId(id);
      setLayout((prev) => {
        const next = { ...prev, lastOpenFolder: id };
        void writeLayoutState(next);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearFolderClickTimer, setLayout, setActiveFolderId]
  );

  const handleFolderClick = useCallback((id: string, parentId: string | null) => {
    if (!layout.keepFolderExpansion) {
      return;  // 未开启持久化,不处理
    }

    setLayout(currentLayout => {
      const expandedStateTree = currentLayout.expandedStateTree ?? {};
      // 使用传入的 parentId 作为上下文，null 转为 "__root__"
      const contextKey = parentId ?? "__root__";
      const currentExpandedList = expandedStateTree[contextKey] ?? [];

      let nextExpandedList: string[];

      if (currentExpandedList.includes(id)) {
        // 收缩: 只从当前上下文中移除,保留子树状态
        nextExpandedList = currentExpandedList.filter(x => x !== id);
      } else {
        // 展开: 添加到当前上下文
        nextExpandedList = [...currentExpandedList, id];
      }

      const newLayout = {
        ...currentLayout,
        expandedStateTree: {
          ...expandedStateTree,
          [contextKey]: nextExpandedList
        },
        expandedStateVersion: 2 as const
      };

      void writeLayoutState(newLayout);
      return newLayout;
    });
  }, [layout.keepFolderExpansion, setLayout]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFolderToggleGesture = useCallback((id: string, _isOpen: boolean) => {
    clearFolderClickTimer();
    folderClickTimerRef.current = setTimeout(() => {
      folderClickTimerRef.current = null;
      handleFolderClick(id, activeFolderId ?? null);
    }, 220);
  }, [clearFolderClickTimer, handleFolderClick, activeFolderId]);

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
