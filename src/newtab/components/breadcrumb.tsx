import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

export type BreadcrumbSegment = {
  id: string | null;
  title: string;
};

type BreadcrumbProps = {
  segments: BreadcrumbSegment[];
  onNavigate: (id: string | null) => void;
};

export default function Breadcrumb({ segments, onNavigate }: BreadcrumbProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo<BreadcrumbSegment[]>(
    () => [{ id: null, title: "全部书签" }, ...segments],
    [segments]
  );

  useEffect(() => {
    // 打开时尽量把当前层滚到可见区域。
    const el = containerRef.current;
    if (!el) {
      return;
    }
    el.scrollLeft = el.scrollWidth;
  }, [items.length]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full overflow-x-auto",
        "rounded-[16px] border border-black/5 dark:border-white/10",
        "bg-white/45 backdrop-blur-[14px]",
        "px-3 py-2",
        "shadow-[0_10px_24px_rgba(0,0,0,0.06)]"
      )}
      aria-label="当前位置"
    >
      <div className="flex items-center gap-1 min-w-max">
        {items.map((seg, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={`${seg.id ?? "root"}:${idx}`} className="flex items-center gap-1">
              <button
                type="button"
                className={cn(
                  "max-w-[240px] truncate",
                  "text-sm font-semibold",
                  "px-2 py-1 rounded-[12px]",
                  "transition-colors",
                  isLast
                    ? "text-ink bg-black/5"
                    : "text-muted-text hover:text-ink hover:bg-black/5"
                )}
                title={seg.title}
                aria-current={isLast ? "page" : undefined}
                onClick={() => onNavigate(seg.id)}
              >
                {seg.title}
              </button>
              {!isLast && <span className="text-muted-text/70 px-0.5">/</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
