import type { ReactNode, MouseEvent } from "react";
import type { BookmarkNode } from "@/shared/types";
import type { ContextMenuTarget } from "@/newtab/types";
import { getCardTitle } from "@/newtab/utils";
import BackCard from "./back-card";
import BookmarkCard from "./bookmark-card";
import FolderCard from "./folder-card";
import SortableGrid from "./sortable-grid";

type BookmarkGridProps = {
  activeFolderId: string | null;
  currentNodes: BookmarkNode[];
  orderedIds: string[];
  expandedIds: Set<string>;
  editMode: boolean;
  offline: boolean;
  parentIdForCurrentView: string;
  fullPath: BookmarkNode[];
  onReorder: (nextIds: string[]) => void;
  onBackToParent: () => void;
  onFolderToggleGesture: (id: string, isOpen: boolean) => void;
  onSubFolderOpen: (id: string) => void;
  onContextMenu: (event: MouseEvent, target: ContextMenuTarget) => void;
  clearFolderClickTimer: () => void;
};

export default function BookmarkGrid({
  activeFolderId,
  currentNodes,
  orderedIds,
  expandedIds,
  editMode,
  offline,
  parentIdForCurrentView,
  fullPath,
  onReorder,
  onBackToParent,
  onFolderToggleGesture,
  onSubFolderOpen,
  onContextMenu,
  clearFolderClickTimer
}: BookmarkGridProps) {
  const items: ReactNode[] = [];

  if (activeFolderId) {
    const parentTitle = (() => {
      const path = fullPath;
      if (!path || path.length < 2) {
        return "全部书签";
      }
      if (path.length === 2) {
        return "全部书签";
      }
      const parent = path[path.length - 2];
      return getCardTitle(parent);
    })();

    items.push(
      <BackCard
        key="__back__"
        title={parentTitle}
        subtitle="返回上级"
        onClick={onBackToParent}
      />
    );
  }

  if (currentNodes.length === 0) {
    items.push(
      <div key="__empty__" className="col-span-full text-center py-12 text-muted-text">
        <p>这里还没有书签，先在 Edge 里收藏一些吧。</p>
      </div>
    );
    return <>{items}</>;
  }

  const byId = new Map(currentNodes.map((n) => [n.id, n] as const));
  const orderedNodes: BookmarkNode[] = [];
  const seen = new Set<string>();

  for (const id of orderedIds) {
    const n = byId.get(id);
    if (n) {
      orderedNodes.push(n);
      seen.add(id);
    }
  }
  for (const n of currentNodes) {
    if (!seen.has(n.id)) {
      orderedNodes.push(n);
    }
  }

  items.push(
    <SortableGrid
      key={`__sortable__:${activeFolderId ?? "root"}`}
      ids={orderedNodes.map((n) => n.id)}
      disabled={offline || !parentIdForCurrentView || !editMode}
      disabledIds={expandedIds}
      onReorder={onReorder}
      render={({ id, dragHandle, setNodeRef, style, isDragging }) => {
        const node = byId.get(id);
        if (!node) {
          return null;
        }
        const isExpanded = expandedIds.has(node.id);

        if (!node.url) {
          const childrenNodes = node.children ?? [];
          return (
            <FolderCard
              id={node.id}
              title={getCardTitle(node)}
              count={childrenNodes.length}
              isOpen={isExpanded}
              onToggle={() => onFolderToggleGesture(node.id, isExpanded)}
              onDoubleClick={() => {
                clearFolderClickTimer();
                void onSubFolderOpen(node.id);
              }}
              childrenNodes={childrenNodes}
              onSubFolderClick={onSubFolderOpen}
              onContextMenu={onContextMenu}
              dragHandle={dragHandle}
              sortableRef={setNodeRef as unknown as (node: HTMLDivElement | null) => void}
              sortableStyle={style}
              dndDragging={isDragging}
            />
          );
        }

        return (
          <BookmarkCard
            id={node.id}
            title={getCardTitle(node)}
            url={node.url ?? ""}
            disableOpen={editMode}
            onContextMenu={onContextMenu}
            dragHandle={dragHandle}
            sortableRef={setNodeRef as unknown as (node: HTMLDivElement | null) => void}
            sortableStyle={style}
            dndDragging={isDragging}
          />
        );
      }}
    />
  );

  return <>{items}</>;
}
