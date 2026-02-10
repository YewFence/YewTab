import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ContextMenuTarget } from "../types";
import { Dialog } from "@/components/ui/dialog";

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
  const [cachedTarget, setCachedTarget] = useState<ContextMenuTarget | null>(target);

  useEffect(() => {
    if (target) {
      setCachedTarget(target);
    }
  }, [target]);

  // 在关闭动画期间使用缓存的 target
  const effectiveTarget = target || cachedTarget;

  const isFolder = effectiveTarget?.kind === "folder";
  const initialTitle = (effectiveTarget?.kind === "bookmark" || effectiveTarget?.kind === "folder") ? effectiveTarget.title : "";
  const initialUrl = effectiveTarget?.kind === "bookmark" ? effectiveTarget.url : "";

  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const dialogTitle = useMemo(() => {
    if (effectiveTarget?.kind === "folder") {
      return "重命名文件夹";
    }
    return "编辑书签";
  }, [effectiveTarget?.kind]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setTitle(initialTitle);
    setUrl(initialUrl);
    setError(null);
    setPending(false);

    const t = window.setTimeout(() => titleRef.current?.focus(), 50);
    return () => {
      window.clearTimeout(t);
    };
  }, [open, initialTitle, initialUrl]);

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

  if (!effectiveTarget) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} pending={pending}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-ink">{dialogTitle}</div>
          <div className="mt-1 text-xs text-muted-text">
            {effectiveTarget.kind === "folder" ? "当前仅支持重命名，不支持删除文件夹" : "修改标题和链接，保存后会同步到浏览器书签"}
          </div>
        </div>
        <button
          type="button"
          className={cn(
            "h-9 w-9 rounded-[12px] grid place-items-center",
            "bg-bg-inset hover:bg-bg-inset-hover",
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
              "bg-glass",
              "border border-border-glass",
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
                "bg-glass",
                "border border-border-glass",
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
              "bg-bg-inset hover:bg-bg-inset-hover",
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
    </Dialog>
  );
}
