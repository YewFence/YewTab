import type { MouseEvent } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { getFaviconUrl } from "../utils";
import type { ContextMenuTarget } from "../types";
import type { SortableDragHandle } from "./sortable-grid";
import type { CSSProperties } from "react";

type BookmarkCardProps = {
  id: string;
  title: string;
  url: string;
  disableOpen?: boolean;
  onContextMenu?: (event: MouseEvent, target: ContextMenuTarget) => void;
  dragHandle?: SortableDragHandle | null;
  sortableRef?: (node: HTMLDivElement | null) => void;
  sortableStyle?: CSSProperties;
  dndDragging?: boolean;
};

export default function BookmarkCard({
  id,
  title,
  url,
  disableOpen = false,
  onContextMenu,
  dragHandle,
  sortableRef,
  sortableStyle,
  dndDragging = false
}: BookmarkCardProps) {
  const reduceMotion = useReducedMotion();
  const layoutTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.2, 0, 0, 1] as const };

  const host = (() => {
    try {
      return url ? new URL(url).hostname : "";
    } catch {
      return "";
    }
  })();

  const handleOpen = () => {
    if (disableOpen) {
      return;
    }
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const cardListeners = dragHandle
    ? {
        ...(dragHandle.attributes as unknown as Record<string, unknown>),
        ...(dragHandle.listeners as unknown as Record<string, unknown>)
      }
    : null;

  return (
    <motion.div
      className={cn(
        "relative aspect-[2.4/1] z-[1] group",
        dragHandle ? "cursor-grab active:cursor-grabbing" : undefined
      )}
      layout={!dndDragging}
      transition={dndDragging ? { duration: 0 } : layoutTransition}
      ref={(node) => {
        sortableRef?.(node);
        dragHandle?.setActivatorNodeRef(node);
      }}
      style={sortableStyle}
      data-yew-context="bookmark"
      data-yew-id={id}
      data-yew-title={title}
      data-yew-url={url}
      {...(cardListeners as unknown as Record<string, unknown>)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, { kind: "bookmark", id, title, url });
      }}
    >
      <button
        className={cn(
          "absolute inset-0 w-full h-full bg-card-bg rounded-radius-lg",
          "p-4 flex items-center gap-4 border border-border-glass",
          "shadow-card text-left",
          "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          // 悬浮效果（整理模式下避免放大影响拖拽）
          !dragHandle ? "group-hover:z-10 group-hover:w-[110%] group-hover:h-[140%]" : null,
          !dragHandle ? "group-hover:top-[-20%] group-hover:left-[-5%]" : null,
          "group-hover:shadow-card-hover group-hover:bg-glass-strong",
          "group-hover:backdrop-blur-[10px]",
          dragHandle ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
        )}
        type="button"
        onClick={(e) => {
          if (disableOpen) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          handleOpen();
        }}
        aria-disabled={disableOpen || undefined}
      >
        <img
          src={getFaviconUrl(url)}
          alt=""
          className="w-11 h-11 rounded-[10px] object-contain bg-muted p-1 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
          }}
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div
            className="text-[15px] font-semibold mb-1 truncate text-ink group-hover:whitespace-normal"
            title={title}
          >
            {title}
          </div>
          {host && <div className="text-xs text-muted-text truncate">{host}</div>}
        </div>
      </button>
    </motion.div>
  );
}
