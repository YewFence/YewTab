import { useState, useEffect, useRef } from "react";
import type { BookmarkNode, LayoutState } from "@/shared/types";
import { readLayoutState, writeLayoutState } from "@/lib/storage";
import { emptyLayout, findNodeById, getTopLevelNodes } from "@/newtab/utils";

export function useLayoutState(
  tree: BookmarkNode[],
  activeFolderId: string | null,
  setActiveFolderId: (id: string | null) => void,
  setErrorMessage: (msg: string | null) => void
) {
  const [layout, setLayout] = useState<LayoutState>(emptyLayout);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useEffect(() => {
    void readLayoutState().then((state) => {
      setLayout(state);
      if (state.startupFolderId) {
        setActiveFolderId(state.startupFolderId);
        return;
      }
      if (state.lastOpenFolder) {
        setActiveFolderId(state.lastOpenFolder);
      }
    });
  }, [setActiveFolderId]);

  useEffect(() => {
    if (!tree.length) {
      return;
    }
    const startupId = layout.startupFolderId;
    if (!startupId) {
      return;
    }
    const rootNodes = getTopLevelNodes(tree);
    const found = findNodeById(rootNodes, startupId);
    if (found) {
      return;
    }

    setErrorMessage("启动文件夹已不存在，已自动清除设置");
    setLayout((prev) => {
      const next = { ...prev, startupFolderId: null };
      void writeLayoutState(next);
      return next;
    });
    if (activeFolderId === startupId) {
      setActiveFolderId(null);
    }
  }, [tree, layout.startupFolderId, activeFolderId, setActiveFolderId, setErrorMessage]);

  return { layout, setLayout, layoutRef };
}
