import type { MouseEvent } from "react";
import { useRef, useEffect } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ClipboardOperation } from "@/hooks/use-clipboard";
import type { BookmarkNode } from "../../shared/types";
import BookmarkCard from "./bookmark-card";
import type { ContextMenuTarget } from "../types";
import type { SortableDragHandle } from "./sortable-grid";
import type { CSSProperties } from "react";

type FolderCardProps = {
  id: string;
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onDoubleClick: () => void;
  childrenNodes?: BookmarkNode[];
  onSubFolderClick?: (id: string) => void;
  onContextMenu?: (event: MouseEvent, target: ContextMenuTarget) => void;
  dragHandle?: SortableDragHandle | null;
  sortableRef?: (node: HTMLDivElement | null) => void;
  sortableStyle?: CSSProperties;
  dndDragging?: boolean;
  isInClipboard?: boolean;
  clipboardOperation?: ClipboardOperation | null;

  // 新增 props：支持嵌套展开
  expandedStateTree?: Record<string, string[]>;  // 树形展开状态
  parentFolderId?: string | null;                // 父文件夹ID,用于确定上下文
  onFolderToggle?: (id: string, parentId: string | null) => void;  // 切换子文件夹展开状态（传递父文件夹ID）
  maxDepth?: number;                             // 最大嵌套深度，默认 3
  currentDepth?: number;                         // 当前嵌套深度，默认 0
  clearFolderClickTimer?: () => void;            // 清除手势定时器（用于双击检测）
};

export default function FolderCard({
  id,
  title,
  count,
  isOpen,
  onToggle,
  onDoubleClick,
  childrenNodes,
  onSubFolderClick,
  onContextMenu,
  dragHandle,
  sortableRef,
  sortableStyle,
  dndDragging = false,
  isInClipboard = false,
  clipboardOperation = null,
  expandedStateTree,
  // parentFolderId,
  onFolderToggle,
  maxDepth = 3,
  currentDepth = 0,
  clearFolderClickTimer
}: FolderCardProps) {
  const reduceMotion = useReducedMotion();
  const layoutTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.2, 0, 0, 1] as const };

  // 子文件夹手势定时器
  const subFolderClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (subFolderClickTimerRef.current) {
        clearTimeout(subFolderClickTimerRef.current);
        subFolderClickTimerRef.current = null;
      }
    };
  }, []);

  // 子文件夹单击处理（220ms 延迟）
  const handleSubFolderSingleClick = (subId: string, canExpand: boolean) => {
    if (subFolderClickTimerRef.current) {
      clearTimeout(subFolderClickTimerRef.current);
    }
    subFolderClickTimerRef.current = setTimeout(() => {
      subFolderClickTimerRef.current = null;
      if (canExpand) {
        onFolderToggle?.(subId, id);  // 展开/收起，传递父文件夹 ID
      } else {
        onSubFolderClick?.(subId);  // 到达深度上限，导航进入
      }
    }, 220);
  };

  // 子文件夹双击处理
  const handleSubFolderDoubleClick = (subId: string) => {
    if (subFolderClickTimerRef.current) {
      clearTimeout(subFolderClickTimerRef.current);
      subFolderClickTimerRef.current = null;
    }
    onSubFolderClick?.(subId);  // 双击始终导航
  };

  const cardListeners = dragHandle
    ? {
        ...(dragHandle.attributes as unknown as Record<string, unknown>),
        ...(dragHandle.listeners as unknown as Record<string, unknown>)
      }
    : null;

  const clipboardStyle = !isOpen && isInClipboard
    ? clipboardOperation === "cut"
      ? "opacity-50 border-dashed !border-2 !border-primary"
      : clipboardOperation === "copy"
        ? "border-dashed !border-2 !border-primary"
        : null
    : null;

  return (
    <motion.div
      className={cn(
        "relative z-[1] group/folder",
        isOpen ? "col-span-full aspect-auto z-[5]" : "aspect-[2.4/1]",
        dragHandle ? "cursor-grab active:cursor-grabbing" : undefined
      )}
      layout={!dndDragging}
      transition={dndDragging ? { duration: 0 } : layoutTransition}
      ref={(node) => {
        sortableRef?.(node);
        dragHandle?.setActivatorNodeRef(node);
      }}
      style={sortableStyle}
      data-yew-context="folder"
      data-yew-id={id}
      data-yew-title={title}
      {...(cardListeners as unknown as Record<string, unknown>)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, { kind: "folder", id, title });
      }}
    >
      <div
        className={cn(
          "flex flex-col p-0 bg-glass-subtle backdrop-blur-[10px]",
          "border border-border-glass rounded-radius-lg shadow-card overflow-hidden",
          "transition-[background-color,box-shadow,border-color] duration-200",
          isOpen
            ? "relative inset-auto h-auto bg-glass-strong border-accent-blue shadow-[0_0_0_2px_rgba(47,128,237,0.2)]"
            : "h-full hover:shadow-card-hover hover:bg-glass-strong",
          // 剪切板视觉反馈
          clipboardStyle
        )}
      >
        {/* Closed view */}
        {!isOpen && (
          <button
            className={cn(
              "w-full h-full text-left",
              "p-4 flex items-center gap-4",
              "bg-transparent border-0",
              dragHandle ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            )}
            type="button"
            onClick={onToggle}
            onDoubleClick={onDoubleClick}
            title={title}
          >
            <div className="w-11 h-11 rounded-[10px] grid place-items-center bg-secondary shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-text"
              >
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
              </svg>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="text-[15px] font-semibold mb-1 truncate text-ink">{title}</div>
              <div className="text-xs text-muted-text truncate">{count} 项</div>
            </div>
          </button>
        )}

        {/* Expanded Content: rely on layout size animation; content is clipped by overflow-hidden */}
        {isOpen && childrenNodes && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 w-full p-6">
            {/* Collapse card (top-left) */}
            <div className="relative aspect-[2.4/1] z-[1] group">
              <button
                className={cn(
                  "absolute inset-0 w-full h-full rounded-radius-lg",
                  "p-4 flex items-center gap-4 text-left",
                  "shadow-card cursor-pointer",
                  "border border-[rgba(47,128,237,0.35)] bg-[rgba(47,128,237,0.10)]",
                  "transition-[background-color,box-shadow] duration-200",
                  "hover:bg-[rgba(47,128,237,0.14)] hover:shadow-card-hover"
                )}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onDoubleClick();
                }}
                title="收起"
              >
                <div className="w-11 h-11 rounded-[10px] grid place-items-center bg-[rgba(47,128,237,0.12)] shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[rgba(47,128,237,0.95)]"
                  >
                    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
                  </svg>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="text-[15px] font-semibold mb-1 truncate text-ink">{title}</div>
                  <div className="text-xs text-muted-text truncate">{count} 项 · 点击收起</div>
                </div>
                <div className="shrink-0 text-muted-text">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </div>
              </button>
            </div>

            {childrenNodes.map((node) => {
              // Empty folder has no children, so classify by URL.
              if (!node.url) {
                const subChildren = node.children ?? [];

                // 检查是否可以继续展开
                const canExpand = currentDepth < maxDepth;
                // 从 expandedStateTree 中判断子文件夹是否展开
                const isSubOpen = canExpand && (expandedStateTree?.[id]?.includes(node.id) ?? false);

                return (
                  <FolderCard
                    key={node.id}
                    id={node.id}
                    title={node.title || "未命名"}
                    count={subChildren.length}
                    isOpen={isSubOpen}
                    onToggle={() => handleSubFolderSingleClick(node.id, canExpand)}
                    onDoubleClick={() => handleSubFolderDoubleClick(node.id)}
                    childrenNodes={subChildren}
                    onSubFolderClick={onSubFolderClick}
                    onContextMenu={onContextMenu}

                    // 递归传递 props
                    expandedStateTree={expandedStateTree}
                    parentFolderId={id}  // 传递当前文件夹ID作为父上下文
                    onFolderToggle={onFolderToggle}
                    maxDepth={maxDepth}
                    currentDepth={currentDepth + 1}
                    clearFolderClickTimer={clearFolderClickTimer}
                  />
                );
              }

              return (
                <BookmarkCard
                  key={node.id}
                  id={node.id}
                  title={node.title || (node.url ?? "")}
                  url={node.url ?? ""}
                  onContextMenu={onContextMenu}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
