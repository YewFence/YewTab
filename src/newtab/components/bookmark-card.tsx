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
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <motion.div
      className="relative aspect-[2.4/1] z-[1] group"
      layout={!dndDragging}
      transition={dndDragging ? { duration: 0 } : layoutTransition}
      ref={sortableRef}
      style={sortableStyle}
      data-yew-context="bookmark"
      data-yew-id={id}
      data-yew-title={title}
      data-yew-url={url}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, { kind: "bookmark", id, title, url });
      }}
    >
      {dragHandle && (
        <button
          type="button"
          className={cn(
            "absolute top-3 right-3 z-[20]",
            "h-8 w-8 rounded-[10px]",
            "grid place-items-center",
            "bg-white/70 border border-black/5",
            "backdrop-blur-[10px]",
            "shadow-[0_2px_10px_rgba(0,0,0,0.06)]",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            "cursor-grab active:cursor-grabbing"
          )}
          ref={dragHandle.setActivatorNodeRef as unknown as (node: HTMLButtonElement | null) => void}
          {...(dragHandle.attributes as unknown as Record<string, unknown>)}
          {...(dragHandle.listeners as unknown as Record<string, unknown>)}
          aria-label="拖拽排序"
          title="拖拽排序"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-text"
          >
            <circle cx="9" cy="5" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="19" r="1" />
          </svg>
        </button>
      )}
      <button
        className={cn(
          "absolute inset-0 w-full h-full bg-card-bg rounded-radius-lg",
          "p-4 flex items-center gap-4 border border-transparent",
          "shadow-card cursor-pointer text-left",
          "transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]",
          // 悬浮效果
          "group-hover:z-10 group-hover:w-[110%] group-hover:h-[140%]",
          "group-hover:top-[-20%] group-hover:left-[-5%]",
          "group-hover:shadow-card-hover group-hover:bg-glass-strong",
          "group-hover:backdrop-blur-[10px]"
        )}
        type="button"
        onClick={handleOpen}
      >
        <img
          src={getFaviconUrl(url)}
          alt=""
          className="w-11 h-11 rounded-[10px] object-contain bg-[#f0f0f5] p-1 shrink-0"
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
