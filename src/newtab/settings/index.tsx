import { useEffect, useMemo, useState } from "react";
import type { SettingsTabDefinition, SettingsTabKey } from "@/newtab/settings/types";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconClose, IconData, IconGeneral, IconInfo, IconPalette } from "@/newtab/settings/icons";
import GeneralTab from "@/newtab/settings/tabs/general";
import AppearanceTab from "@/newtab/settings/tabs/appearance";
import DataTab from "@/newtab/settings/tabs/data";
import AboutTab from "@/newtab/settings/tabs/about";

export type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
  tabs?: SettingsTabDefinition[];
  initialTabKey?: SettingsTabKey;
};

export default function SettingsModal({ open, onClose, tabs, initialTabKey }: SettingsModalProps) {
  const defaultTabs = useMemo<SettingsTabDefinition[]>(
    () => [
      {
        key: "general",
        title: "常规",
        description: "搜索、行为与偏好",
        icon: <IconGeneral className="h-4 w-4" />,
        render: () => <GeneralTab />
      },
      {
        key: "appearance",
        title: "外观",
        description: "主题与展示方式",
        icon: <IconPalette className="h-4 w-4" />,
        render: () => <AppearanceTab />
      },
      {
        key: "data",
        title: "数据",
        description: "导入与导出",
        icon: <IconData className="h-4 w-4" />,
        render: () => <DataTab />
      },
      {
        key: "about",
        title: "关于",
        description: "版本与调试",
        icon: <IconInfo className="h-4 w-4" />,
        render: () => <AboutTab />
      }
    ],
    []
  );

  const resolvedTabs = tabs?.length ? tabs : defaultTabs;
  const firstKey = resolvedTabs[0]?.key ?? "general";
  const [active, setActive] = useState<SettingsTabKey>(initialTabKey ?? firstKey);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (initialTabKey) {
      setActive(initialTabKey);
      return;
    }
    setActive((prev) => (resolvedTabs.some((t) => t.key === prev) ? prev : firstKey));
  }, [open, initialTabKey, resolvedTabs, firstKey]);

  const activeTab = resolvedTabs.find((t) => t.key === active) ?? resolvedTabs[0];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/25"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
            role="presentation"
          />

          <motion.div
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[min(1100px,calc(100vw-28px))] h-[min(720px,calc(100vh-28px))]",
              "rounded-[22px] overflow-hidden",
              "bg-glass backdrop-blur-[22px]",
              "border border-border-glass",
              "shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
            )}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            role="dialog"
            aria-modal="true"
            aria-label="设置"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border-glass">
              <div className="min-w-0">
                <div className="text-lg font-extrabold tracking-tight">设置</div>
              </div>
              <Button variant="ghost" className="h-10 w-10 px-0" onClick={onClose} aria-label="关闭">
                <IconClose className="h-5 w-5" />
              </Button>
            </div>

            <div className="h-[calc(100%-72px)] grid grid-cols-1 md:grid-cols-[260px_1fr]">
              <nav
                className={cn(
                  "border-b md:border-b-0 md:border-r border-border-glass",
                  "bg-glass-subtle",
                  "overflow-x-auto md:overflow-y-auto",
                  "px-3 py-3"
                )}
                aria-label="设置栏目"
              >
                <div className="flex md:flex-col gap-2 md:gap-1">
                  {resolvedTabs.map((t) => {
                    const isActive = t.key === active;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        className={cn(
                          "text-left",
                          "flex items-center gap-3",
                          "rounded-[16px] px-3 py-2",
                          "transition-all duration-150",
                          "border border-transparent",
                          isActive
                            ? "bg-glass-strong border-border-glass shadow-[0_10px_22px_rgba(0,0,0,0.08)]"
                            : "hover:bg-glass"
                        )}
                        onClick={() => setActive(t.key)}
                      >
                        <span className={cn("shrink-0", isActive ? "text-primary" : "text-muted-text")}>{t.icon}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{t.title}</span>
                          <span className="hidden md:block text-xs text-muted-text mt-0.5 truncate">{t.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <main className="overflow-y-auto px-5 py-5 bg-bg-inset">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab?.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16 }}
                  >
                    {activeTab?.render()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
