import SearchBar from "./search-bar";
import { Button } from "@/components/ui/button";
import { IconEdit, IconSettings } from "@/newtab/settings/icons";

type AppHeaderProps = {
  offline: boolean;
  editMode: boolean;
  onEditModeToggle: () => void;
  onSettingsOpen: () => void;
  onCreateFolder: () => void;
};

export default function AppHeader({
  offline,
  editMode,
  onEditModeToggle,
  onSettingsOpen,
  onCreateFolder
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-6 mb-10 flex-wrap">
      <div>
        <span className="text-[28px] font-bold tracking-tight block">Yew Tab</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-text font-medium">书签一眼可见</span>
          {import.meta.env.DEV && (
            <span className="text-xs text-muted-text/50 font-mono">{__APP_VERSION__}</span>
          )}
        </div>
      </div>

      <SearchBar />
      <div className="flex gap-3">
        {offline && (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            离线快照
          </span>
        )}
        <Button
          variant="secondary"
          className={
            editMode
              ? "h-10 px-3 border border-[rgba(47,128,237,0.28)] bg-[rgba(47,128,237,0.12)] text-[rgba(47,128,237,0.95)]"
              : "h-10 px-3"
          }
          aria-label={editMode ? "退出整理模式" : "进入整理模式"}
          title={editMode ? "退出整理模式 (Alt+E)" : "进入整理模式 (Alt+E)"}
          onClick={onEditModeToggle}
        >
          <IconEdit className="h-5 w-5" />
          <span className="text-sm">整理</span>
        </Button>
        <Button
          variant="secondary"
          className="h-10 w-10 px-0"
          aria-label="打开设置"
          onClick={onSettingsOpen}
        >
          <IconSettings className="h-5 w-5" />
        </Button>
        <Button variant="primary" onClick={onCreateFolder}>
          新增文件夹
        </Button>
      </div>
    </header>
  );
}
