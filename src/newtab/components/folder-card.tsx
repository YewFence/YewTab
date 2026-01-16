type FolderCardProps = {
  title: string;
  count: number;
  isOpen: boolean;
  onOpen: () => void;
};

export default function FolderCard({ title, count, isOpen, onOpen }: FolderCardProps) {
  return (
    <div className="card-wrapper">
      <button 
        className={`card card--folder ${isOpen ? "is-open" : ""}`} 
        type="button" 
        onClick={onOpen}
      >
        <div className="card__icon" style={{ display: 'grid', placeItems: 'center', background: '#e1e1e6' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#5b5a6a' }}>
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
          </svg>
        </div>
        <div className="card__content">
          <div className="card__title" title={title}>{title}</div>
          <div className="card__meta">{count} 项</div>
        </div>
      </button>
    </div>
  );
}