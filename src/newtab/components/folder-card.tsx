import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BookmarkNode } from "../../shared/types";
import BookmarkCard from "./bookmark-card";

type FolderCardProps = {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onDoubleClick: () => void;
  childrenNodes?: BookmarkNode[];
  onSubFolderClick?: (id: string) => void;
};

export default function FolderCard({
  title,
  count,
  isOpen,
  onToggle,
  onDoubleClick,
  childrenNodes,
  onSubFolderClick
}: FolderCardProps) {
  return (
    <motion.div
      className={cn(
        "relative z-[1]",
        isOpen
          ? "col-span-full aspect-auto h-auto min-h-[140px] z-[5]"
          : "aspect-[2.4/1] group"
      )}
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div
        className={cn(
          "flex flex-col p-0 bg-white/50 backdrop-blur-[10px]",
          "border border-white/40 rounded-radius-lg shadow-card",
          "transition-all duration-300",
          isOpen
            ? "relative inset-auto h-auto bg-white/85 border-accent-blue shadow-[0_0_0_2px_rgba(47,128,237,0.2)]"
            : cn(
                "absolute inset-0 w-full h-full",
                "group-hover:z-10 group-hover:w-[110%] group-hover:h-[140%]",
                "group-hover:top-[-20%] group-hover:left-[-5%]",
                "group-hover:shadow-card-hover group-hover:bg-glass-strong"
              )
        )}
        onClick={(e) => {
          if (!isOpen) onToggle();
        }}
        onDoubleClick={onDoubleClick}
        layout
      >
        {/* Header / Summary View */}
        <div
          className={cn(
            "flex items-center gap-4 p-4 w-full min-h-full shrink-0",
            isOpen && "min-h-auto border-b border-black/5 cursor-pointer"
          )}
          onClick={isOpen ? onToggle : undefined}
        >
          {/* Collapse Button (Visible only when open, on the left) */}
          {isOpen && (
            <button
              className="mr-3 bg-transparent border-none cursor-pointer p-2 rounded-full text-muted-text flex items-center justify-center hover:bg-black/10 hover:text-ink"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              title="收缩"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>
          )}

          <div className="w-11 h-11 rounded-[10px] grid place-items-center bg-[#e1e1e6] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-text">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
            </svg>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="text-[15px] font-semibold mb-1 truncate text-ink" title={title}>{title}</div>
            <div className="text-xs text-muted-text truncate">{count} 项</div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isOpen && childrenNodes && (
            <motion.div
              className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 w-full p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {childrenNodes.map(node => (
                node.children?.length ? (
                  <FolderCard
                    key={node.id}
                    title={node.title || "未命名"}
                    count={node.children.length}
                    isOpen={false}
                    onToggle={() => onSubFolderClick?.(node.id)}
                    onDoubleClick={() => onSubFolderClick?.(node.id)}
                    childrenNodes={node.children}
                    onSubFolderClick={onSubFolderClick}
                  />
                ) : (
                  <BookmarkCard
                    key={node.id}
                    title={node.title || (node.url ?? "")}
                    url={node.url ?? ""}
                  />
                )
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
