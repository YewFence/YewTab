import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ContextMenuItem = {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onSelect: () => void;
};

type ContextMenuProps = {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export default function ContextMenu({ open, x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: x, top: y });

  const enabledItems = useMemo(() => items.filter((i) => !i.disabled), [items]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    const el = menuRef.current;
    if (!el) {
      setPos({ left: x, top: y });
      return;
    }

    const rect = el.getBoundingClientRect();
    const margin = 10;

    const clampedLeft = Math.min(Math.max(x, margin), window.innerWidth - rect.width - margin);
    const clampedTop = Math.min(Math.max(y, margin), window.innerHeight - rect.height - margin);
    setPos({ left: clampedLeft, top: clampedTop });
  }, [open, x, y, items.length]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const el = menuRef.current;
      if (!el) {
        onClose();
        return;
      }
      if (!el.contains(e.target as Node)) {
        onClose();
      }
    };

    const onWheel = () => onClose();
    const onResize = () => onClose();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, { capture: true } as AddEventListenerOptions);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1000]"
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-hidden
    >
      <div
        ref={menuRef}
        className={cn(
          "fixed min-w-[190px]",
          "rounded-[14px] border border-white/50",
          "bg-glass-strong/90 backdrop-blur-[14px]",
          "shadow-[0_18px_40px_rgba(0,0,0,0.18)]",
          "py-1"
        )}
        style={{ left: pos.left, top: pos.top }}
        role="menu"
      >
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={cn(
              "w-full text-left px-3 py-2",
              "text-[13px] font-semibold",
              "transition-colors",
              item.disabled
                ? "text-muted-text/60 cursor-not-allowed"
                : item.danger
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-ink hover:bg-black/5",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            )}
            onClick={() => {
              if (item.disabled) {
                return;
              }
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ))}

        {enabledItems.length === 0 && (
          <div className="px-3 py-2 text-xs text-muted-text">没有可用操作</div>
        )}
      </div>
    </div>,
    document.body
  );
}
