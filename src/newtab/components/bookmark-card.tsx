import { getFaviconUrl } from "../utils";

type BookmarkCardProps = {
  title: string;
  url: string;
};

export default function BookmarkCard({ title, url }: BookmarkCardProps) {
  const host = (() => {
    try {
      return url ? new URL(url).hostname : "";
    } catch {
      return "";
    }
  })();

  const handleOpen = () => {
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="card-wrapper">
      <button className="card" type="button" onClick={handleOpen}>
        <img 
          src={getFaviconUrl(url)} 
          alt="" 
          className="card__icon"
          onError={(e) => {
            // Fallback to a generic icon if favicon fails
            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
          }}
        />
        <div className="card__content">
          <div className="card__title" title={title}>{title}</div>
          {host && <div className="card__meta">{host}</div>}
        </div>
      </button>
    </div>
  );
}