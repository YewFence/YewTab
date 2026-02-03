import { motion, AnimatePresence } from "framer-motion";
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
      className={`card-wrapper ${isOpen ? "expanded-wrapper" : ""}`}
      layout
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <motion.div 
        className={`card card--folder ${isOpen ? "is-open" : ""}`}
        onClick={(e) => {
           // If expanded, don't toggle on background click (optional, but good for UX)
           // But here we want to click to close maybe? 
           // actually user said "button to collapse", so maybe clicking header collapses too?
           // Let's keep simple click to toggle for the header part.
           // But wait, if it's expanded, the whole thing is the card.
           // We need a specific header area or button to toggle.
           if (!isOpen) onToggle();
        }}
        onDoubleClick={onDoubleClick}
        layout
      >
        {/* Header / Summary View */}
        <div className="folder-header" onClick={isOpen ? onToggle : undefined}>
            {/* Collapse Button (Visible only when open, on the left) */}
            {isOpen && (
                <button 
                    className="collapse-btn"
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

            <div className="card__icon" style={{ display: 'grid', placeItems: 'center', background: '#e1e1e6' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#5b5a6a' }}>
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
            </svg>
            </div>
            <div className="card__content">
            <div className="card__title" title={title}>{title}</div>
            <div className="card__meta">{count} 项</div>
            </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
            {isOpen && childrenNodes && (
                <motion.div 
                    className="folder-grid"
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
                                isOpen={false} // Nested folders don't auto-expand for now
                                onToggle={() => onSubFolderClick?.(node.id)} // Click nested folder -> Drill down
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
