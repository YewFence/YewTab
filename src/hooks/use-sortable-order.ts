import { useState, useEffect, useRef } from "react";
import type { BookmarkNode } from "@/shared/types";
import { reorderBookmarkChildren } from "@/lib/messaging";

export function useSortableOrder(
  currentNodes: BookmarkNode[],
  activeFolderId: string | null,
  parentIdForCurrentView: string,
  offline: boolean,
  setErrorMessage: (msg: string | null) => void
) {
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const reorderRequestIdRef = useRef(0);

  useEffect(() => {
    setOrderedIds(currentNodes.map((n) => n.id));
    reorderRequestIdRef.current += 1;
  }, [activeFolderId, currentNodes]);

  const handleReorder = (nextIds: string[]) => {
    const prev = orderedIds;
    setOrderedIds(nextIds);

    if (offline) {
      setErrorMessage("离线快照模式下无法写回排序");
      setOrderedIds(prev);
      return;
    }
    if (!parentIdForCurrentView) {
      setErrorMessage("当前视图无法确定父级节点，写回失败");
      setOrderedIds(prev);
      return;
    }

    const requestId = ++reorderRequestIdRef.current;
    void reorderBookmarkChildren({ parentId: parentIdForCurrentView, orderedIds: nextIds }).then((resp) => {
      if (reorderRequestIdRef.current !== requestId) {
        return;
      }
      if (!resp.success) {
        setErrorMessage(resp.error ?? "写回排序失败");
        setOrderedIds(prev);
      }
    });
  };

  return { orderedIds, handleReorder };
}
