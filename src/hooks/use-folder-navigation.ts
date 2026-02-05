import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { BookmarkNode, LayoutState } from "@/shared/types";
import { writeLayoutState } from "@/lib/storage";
import { findNodeById, getTopLevelNodes, getCardTitle, findPathInTree } from "@/newtab/utils";

export function useFolderNavigation(
  tree: BookmarkNode[],
  layout: LayoutState,
  setLayout: React.Dispatch<React.SetStateAction<LayoutState>>
) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const folderClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setExpandedIds(new Set());
      setActiveFolderId(id);
      setLayout((prev) => {
        const next = { ...prev, lastOpenFolder: id };
        void writeLayoutState(next);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [clearFolderClickTimer, setLayout]
  );

  const handleFolderClick = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

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
