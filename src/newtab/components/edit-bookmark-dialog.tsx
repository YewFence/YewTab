import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ContextMenuTarget } from "../types";

type EditBookmarkDialogProps = {
  open: boolean;
  target: ContextMenuTarget | null;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: { title: string; url?: string }) => Promise<boolean>;
};

export default function EditBookmarkDialog({
  open,
  target,
  serverError,
  onClose,
  onSubmit
}: EditBookmarkDialogProps) {
  const isFolder = target?.kind === "folder";
  const initialTitle = target?.title ?? "";
  const initialUrl = target?.kind === "bookmark" ? target.url : "";

  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const dialogTitle = useMemo(() => {
    if (target?.kind === "folder") {
      return "重命名文件夹";
    }
    return "编辑书签";
  }, [target?.kind]);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(initialTitle);
    setUrl(initialUrl);
    setError(null);
    setPending(false);

    const t = window.setTimeout(() => titleRef.current?.focus(), 0);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!pendingRef.current) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, initialTitle, initialUrl, onClose]);

  if (!open || !target) {
    return null;
  }

  const validate = (): { title: string; url?: string } | null => {
    const nextTitle = title.trim() || "未命名";
    if (isFolder) {
      return { title: nextTitle };
    }
    const nextUrl = url.trim();
    if (!nextUrl) {
      setError("链接不能为空");
      return null;
    }
    try {
      // 仅做基础合法性校验；不强制协议策略。
      void new URL(nextUrl);
    } catch {
      setError("链接格式不正确");
      return null;
    }
    return { title: nextTitle, url: nextUrl };
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] grid place-items-center px-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[4px]"
        onMouseDown={() => {
          if (!pending) {
            onClose();
          }
        }}
      />

      <div
        className={cn(
          "relative w-full max-w-[520px]",
          "rounded-[18px] border border-white/50",
          "bg-glass-strong/95 backdrop-blur-[14px]",
          "shadow-[0_20px_60px_rgba(0,0,0,0.22)]",
          "p-5"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[15px] font-bold text-ink">{dialogTitle}</div>
            <div className="mt-1 text-xs text-muted-text">
              {target.kind === "folder" ? "当前仅支持重命名，不支持删除文件夹" : "修改标题和链接，保存后会同步到浏览器书签"}
            </div>
          </div>
          <button
            type="button"
            className={cn(
              "h-9 w-9 rounded-[12px] grid place-items-center",
              "bg-black/5 hover:bg-black/10",
              "transition-colors",
              pending && "opacity-60 cursor-not-allowed"
            )}
            disabled={pending}
            onClick={onClose}
            aria-label="关闭"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-text"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pending) {
              return;
            }
            setError(null);
            const payload = validate();
            if (!payload) {
              return;
            }
            setPending(true);
            try {
              const ok = await onSubmit(payload);
              if (ok) {
                onClose();
              }
            } finally {
              setPending(false);
            }
          }}
        >
          <label className="block">
            <div className="text-xs font-semibold text-muted-text mb-1">标题</div>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "w-full rounded-[12px] px-3 py-2",
                "bg-white/70 dark:bg-black/20",
                "border border-white/40",
                "text-ink",
                "outline-none",
                "focus:ring-2 focus:ring-ring/30 focus:border-transparent",
                pending && "opacity-60 cursor-not-allowed"
              )}
              disabled={pending}
              placeholder="未命名"
            />
          </label>

          {!isFolder && (
            <label className="block">
              <div className="text-xs font-semibold text-muted-text mb-1">链接</div>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={cn(
                  "w-full rounded-[12px] px-3 py-2",
                  "bg-white/70 dark:bg-black/20",
                  "border border-white/40",
                  "text-ink",
                  "outline-none",
                  "focus:ring-2 focus:ring-ring/30 focus:border-transparent",
                  pending && "opacity-60 cursor-not-allowed"
                )}
                disabled={pending}
                placeholder="https://example.com"
              />
            </label>
          )}

          {(error || serverError) && (
            <div className="rounded-[12px] bg-destructive/10 text-destructive px-3 py-2 text-sm">
              {error ?? serverError}
            </div>
          )}

          <div className="pt-1 flex justify-end gap-2">
            <button
              type="button"
              className={cn(
                "px-4 py-2 rounded-[12px] font-semibold",
                "bg-black/5 hover:bg-black/10",
                "text-ink",
                "transition-colors",
                pending && "opacity-60 cursor-not-allowed"
              )}
              disabled={pending}
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-[12px] font-semibold",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "transition-colors",
                pending && "opacity-60 cursor-not-allowed"
              )}
              disabled={pending}
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
