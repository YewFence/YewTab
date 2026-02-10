import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";

type CreateFolderDialogProps = {
  open: boolean;
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (payload: { title: string }) => Promise<boolean>;
};

export default function CreateFolderDialog({ open, serverError, onClose, onSubmit }: CreateFolderDialogProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const dialogTitle = useMemo(() => "新增文件夹", []);

  useEffect(() => {
    if (open) {
      setTitle("");
      setError(null);
      setPending(false);

      // 稍微延迟以确保 Dialog 内容已挂载
      const t = setTimeout(() => titleRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  const validate = (): { title: string } => {
    const nextTitle = title.trim() || "未命名文件夹";
    return { title: nextTitle };
  };

  return (
    <Dialog open={open} onClose={onClose} pending={pending}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-ink">{dialogTitle}</div>
          <div className="mt-1 text-xs text-muted-text">确认后会在当前文件夹下创建</div>
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
          <div className="text-xs font-semibold text-muted-text mb-1">名称</div>
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
            placeholder="未命名文件夹"
          />
        </label>

        {(error || serverError) && (
          <div className="rounded-[12px] bg-destructive/10 text-destructive px-3 py-2 text-sm">
            {error ?? serverError}
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
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
            创建
          </button>
        </div>
      </form>
    </Dialog>
  );
}
