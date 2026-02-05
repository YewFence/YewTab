import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { readSearchSettings, writeSearchSettings } from "../../lib/storage";
import type { SearchEngine } from "../../shared/types";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ChevronDown, Check } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiDuckduckgo } from "react-icons/si";
import { BsBing } from "react-icons/bs";

const SEARCH_URLS: Record<SearchEngine, string> = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q="
};

// 使用 react-icons 中的品牌图标，并为单色图标添加官方品牌色
const ENGINE_CONFIG: Record<SearchEngine, { label: string; icon: React.ComponentType<Record<string, unknown>>; colorClass?: string }> = {
  google: { 
    label: "Google", 
    icon: FcGoogle 
  },
  bing: { 
    label: "Bing", 
    icon: BsBing,
    colorClass: "text-[#008373]" // Bing Teal
  },
  duckduckgo: { 
    label: "DuckDuckGo", 
    icon: SiDuckduckgo,
    colorClass: "text-[#DE5833]" // DuckDuckGo Orange
  }
};

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [engine, setEngine] = useState<SearchEngine>("google");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void readSearchSettings().then((settings) => {
      setEngine(settings.defaultEngine);
    });
    
    // Click outside handler
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setIsOpen(false);
    await writeSearchSettings({ defaultEngine: newEngine });
  };

  const currentConfig = ENGINE_CONFIG[engine];
  const CurrentIcon = currentConfig.icon;

  return (
    <div 
      className="relative z-50 w-full max-w-[500px]"
      ref={containerRef}
    >
      <form
        className={cn(
          "flex items-center gap-2 w-full",
          "bg-glass-subtle backdrop-blur-[20px] p-2 pr-4",
          "rounded-[24px] border border-border-glass",
          "shadow-[0_2px_10px_rgba(0,0,0,0.03)]",
          "transition-all duration-300",
          "focus-within:bg-glass-strong",
          "focus-within:shadow-[0_8px_20px_rgba(0,0,0,0.08)]",
          "focus-within:-translate-y-px"
        )}
        onSubmit={handleSearch}
      >
        {/* Engine Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-[18px]",
            "hover:bg-black/5 active:bg-black/10 transition-colors",
            "cursor-pointer outline-none select-none"
          )}
        >
          <CurrentIcon className={cn("w-5 h-5", currentConfig.colorClass)} />
          <ChevronDown 
            className={cn(
              "w-4 h-4 transition-transform duration-300 text-muted-text/80",
              isOpen ? "rotate-180" : ""
            )} 
          />
        </button>

        <div className="w-px h-5 bg-border-glass mx-1" />

        <input
          type="text"
          className="flex-1 border-none bg-transparent text-base text-ink p-1 focus:outline-none placeholder:text-muted-text/70"
          placeholder={`在 ${currentConfig.label} 上搜索...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        
        <button 
          type="submit"
          className="p-2 rounded-full hover:bg-primary/10 text-primary transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      {/* Custom Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute top-full left-0 mt-2 w-48",
              "bg-glass-strong backdrop-blur-[24px]",
              "rounded-[16px] border border-border-glass",
              "shadow-[0_10px_40px_rgba(0,0,0,0.1)]",
              "overflow-hidden py-1.5 flex flex-col gap-0.5"
            )}
          >
            {(Object.keys(ENGINE_CONFIG) as SearchEngine[]).map((key) => {
              const config = ENGINE_CONFIG[key];
              const Icon = config.icon;
              const isSelected = engine === key;
              
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleEngineChange(key)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 mx-1.5 rounded-[10px]",
                    "text-sm font-medium transition-colors cursor-pointer outline-none",
                    "hover:bg-black/5 text-ink",
                    isSelected && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <Icon className={cn("w-4 h-4", config.colorClass)} />
                  <span className={cn("flex-1 text-left", isSelected && "font-semibold")}>
                    {config.label}
                  </span>
                  {isSelected && (
                    <motion.div 
                      layoutId="check"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Check className="w-4 h-4 text-primary" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
