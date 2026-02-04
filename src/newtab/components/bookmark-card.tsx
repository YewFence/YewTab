import type { MouseEvent } from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import { getFaviconUrl } from "../utils";
import type { ContextMenuTarget } from "../types";

type BookmarkCardProps = {
  id: string;
  title: string;
  url: string;
  onContextMenu?: (event: MouseEvent, target: ContextMenuTarget) => void;
};

export default function BookmarkCard({ id, title, url, onContextMenu }: BookmarkCardProps) {
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
      layout
      transition={layoutTransition}
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
