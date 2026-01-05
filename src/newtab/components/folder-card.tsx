// 渲染文件夹卡片并触发展开动作。
type FolderCardProps = {
  title: string;
  count: number;
  onOpen: () => void;
};

export default function FolderCard({ title, count, onOpen }: FolderCardProps) {
  return (
    <button className="card card--folder" type="button" onClick={onOpen}>
      <span className="card__title">{title}</span>
      <span className="card__meta">{count} 项</span>
    </button>
  );
}
