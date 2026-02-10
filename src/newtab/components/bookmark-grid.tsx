import type { ReactNode, MouseEvent } from "react";
import type { BookmarkNode } from "@/shared/types";
import type { ContextMenuTarget } from "@/newtab/types";
import type { ClipboardItem } from "@/hooks/use-clipboard";
import { getCardTitle } from "@/newtab/utils";
import BackCard from "./back-card";
import BookmarkCard from "./bookmark-card";
import FolderCard from "./folder-card";
import SortableGrid from "./sortable-grid";

type BookmarkGridProps = {
  activeFolderId: string | null;
  currentNodes: BookmarkNode[];
  orderedIds: string[];
  expandedStateTree?: Record<string, string[]>;
  editMode: boolean;
  offline: boolean;
  parentIdForCurrentView: string;
  fullPath: BookmarkNode[];
  openInNewTab?: boolean;
  clipboardItem: ClipboardItem | null;
  onReorder: (nextIds: string[]) => void;
  onBackToParent: () => void;
  onFolderToggleGesture: (id: string, isOpen: boolean) => void;
  onSubFolderOpen: (id: string) => void;
  onContextMenu: (event: MouseEvent, target: ContextMenuTarget) => void;
  clearFolderClickTimer: () => void;
  onFolderToggle: (id: string, parentId: string | null) => void;  // 切换展开状态（传递父文件夹ID）
};

export default function BookmarkGrid({
  activeFolderId,
  currentNodes,
  orderedIds,
  expandedStateTree,
  editMode,
  offline,
  parentIdForCurrentView,
  fullPath,
  openInNewTab,
  clipboardItem,
  onReorder,
  onBackToParent,
  onFolderToggleGesture,
  onSubFolderOpen,
  onContextMenu,
  clearFolderClickTimer,
  onFolderToggle
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
      disabledIds={
        expandedStateTree
          ? new Set(expandedStateTree[activeFolderId ?? "__root__"] ?? [])
          : new Set()
      }
      onReorder={onReorder}
      render={({ id, dragHandle, setNodeRef, style, isDragging }) => {
        const node = byId.get(id);
        if (!node) {
          return null;
        }

        if (!node.url) {
          const childrenNodes = node.children ?? [];
          const contextKey = activeFolderId ?? "__root__";
          const isExpanded = expandedStateTree?.[contextKey]?.includes(node.id) ?? false;

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
              isInClipboard={clipboardItem?.id === node.id}
              clipboardOperation={clipboardItem?.id === node.id ? clipboardItem.operation : null}

              // 新增传递：支持嵌套展开
              expandedStateTree={expandedStateTree}
              parentFolderId={activeFolderId}
              onFolderToggle={onFolderToggle}
              maxDepth={3}
              currentDepth={0}
              clearFolderClickTimer={clearFolderClickTimer}
            />
          );
        }

        return (
          <BookmarkCard
            id={node.id}
            title={getCardTitle(node)}
            url={node.url ?? ""}
            openInNewTab={openInNewTab}
            disableOpen={editMode}
            onContextMenu={onContextMenu}
            dragHandle={dragHandle}
            sortableRef={setNodeRef as unknown as (node: HTMLDivElement | null) => void}
            sortableStyle={style}
            dndDragging={isDragging}
            isInClipboard={clipboardItem?.id === node.id}
            clipboardOperation={clipboardItem?.id === node.id ? clipboardItem.operation : null}
          />
        );
      }}
    />
  );

  return <>{items}</>;
}
