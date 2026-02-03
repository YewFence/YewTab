import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { readSearchSettings, writeSearchSettings } from "../../lib/storage";
import type { SearchEngine } from "../../shared/types";

const SEARCH_URLS: Record<SearchEngine, string> = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

const ENGINE_LABELS: Record<SearchEngine, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo"
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState<SearchEngine>("google");

  useEffect(() => {
    void readSearchSettings().then((settings) => {
      setEngine(settings.defaultEngine);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const searchUrl = SEARCH_URLS[engine] + encodeURIComponent(query.trim());
      window.location.href = searchUrl;
    }
  };

  const handleEngineChange = async (newEngine: SearchEngine) => {
    setEngine(newEngine);
    await writeSearchSettings({ defaultEngine: newEngine });
  };

  return (
    <form
      className={cn(
        "flex items-center gap-3 flex-1 max-w-[500px]",
        "bg-white/60 backdrop-blur-[20px] px-3 py-2",
        "rounded-[16px] border border-white/30",
        "shadow-[0_2px_10px_rgba(0,0,0,0.03)]",
        "transition-all duration-300",
        "focus-within:bg-white/90",
        "focus-within:shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
        "focus-within:-translate-y-px"
      )}
      onSubmit={handleSearch}
    >
      <input
        type="text"
        className="flex-1 border-none bg-transparent text-base text-ink p-1 focus:outline-none"
        placeholder="搜索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="bg-transparent border-none text-sm text-muted-text cursor-pointer focus:outline-none"
        value={engine}
        onChange={(e) => void handleEngineChange(e.target.value as SearchEngine)}
      >
        {(Object.keys(ENGINE_LABELS) as SearchEngine[]).map((key) => (
          <option key={key} value={key}>
            {ENGINE_LABELS[key]}
          </option>
        ))}
      </select>
    </form>
  );
}
