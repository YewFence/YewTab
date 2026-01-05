// 渲染单个书签卡片。
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
    <button className="card card--bookmark" type="button" onClick={handleOpen}>
      <span className="card__title">{title}</span>
      {host && <span className="card__meta">{host}</span>}
    </button>
  );
}
