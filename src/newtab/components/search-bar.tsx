import { useEffect, useState } from "react";
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
    <form className="search-bar" onSubmit={handleSearch}>
      <input
        type="text"
        className="search-bar__input"
        placeholder="搜索..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <select
        className="search-bar__engine-selector"
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
