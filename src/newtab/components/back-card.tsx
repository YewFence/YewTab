import { motion, useReducedMotion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

type BackCardProps = {
  title: string;
  subtitle?: string;
  onClick: () => void;
};

export default function BackCard({ title, subtitle = "返回上级", onClick }: BackCardProps) {
  const reduceMotion = useReducedMotion();
  const layoutTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.2, 0, 0, 1] as const };

  return (
    <motion.div
      className="relative aspect-[2.4/1] z-[1]"
      layout
      transition={layoutTransition}
    >
      <button
        className={cn(
          "absolute inset-0 w-full h-full rounded-radius-lg",
          "p-4 flex items-center gap-4 text-left",
          "shadow-card cursor-pointer",
          "border border-[rgba(47,128,237,0.35)] bg-[rgba(47,128,237,0.10)]",
          "transition-[background-color,box-shadow] duration-200",
          "hover:bg-[rgba(47,128,237,0.14)] hover:shadow-card-hover"
        )}
        type="button"
        onClick={onClick}
        title={subtitle}
      >
        <div className="w-11 h-11 rounded-[10px] grid place-items-center bg-[rgba(47,128,237,0.12)] shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[rgba(47,128,237,0.95)]"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="text-[15px] font-semibold mb-1 truncate text-ink" title={title}>
            {title}
          </div>
          <div className="text-xs text-muted-text truncate">{subtitle}</div>
        </div>
        <div className="shrink-0 text-muted-text">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </div>
      </button>
    </motion.div>
  );
}
