import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  error?: string | null;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  error,
  confirmText = "确认",
  cancelText = "取消",
  danger,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (open) {
      // 稍微延迟以确保 Dialog 内容已挂载
      const t = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      pending={pending}
      maxWidth="420px"
      className="border-white/50"
    >
      <div className="text-[15px] font-bold text-ink">{title}</div>
      {description && <div className="mt-2 text-sm text-muted-text leading-relaxed">{description}</div>}
      {error && <div className="mt-3 rounded-[12px] bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}

      <div className="mt-5 flex justify-end gap-2">
        <button
          ref={cancelRef}
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
          {cancelText}
        </button>
        <button
          type="button"
          className={cn(
            "px-4 py-2 rounded-[12px] font-semibold",
            danger
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
            "transition-colors",
            pending && "opacity-60 cursor-not-allowed"
          )}
          disabled={pending}
          onClick={async () => {
            if (pending) {
              return;
            }
            setPending(true);
            try {
              const ok = await onConfirm();
              if (ok) {
                onClose();
              }
            } finally {
              setPending(false);
            }
          }}
        >
          {confirmText}
        </button>
      </div>
    </Dialog>
  );
}
