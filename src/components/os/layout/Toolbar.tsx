"use client";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  filters?: ReactNode;
  viewSwitcher?: ReactNode;
  resultCount?: number;
  className?: string;
}

export function Toolbar({ searchPlaceholder = "Buscar...", onSearch, searchValue, filters, viewSwitcher, resultCount, className }: ToolbarProps) {
  const [localQuery, setLocalQuery] = useState(searchValue || "");
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLocalQuery(searchValue || "");
  }, [searchValue]);

  const handleChange = (value: string) => {
    setLocalQuery(value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch?.(value), 300);
  };

  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-3", className)}>
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={localQuery}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {localQuery && (
          <button onClick={() => handleChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {filters && <div className="flex items-center gap-2">{filters}</div>}
      <div className="flex items-center gap-2 ml-auto">
        {resultCount !== undefined && <span className="text-xs text-muted-foreground">{resultCount} resultados</span>}
        {viewSwitcher}
      </div>
    </div>
  );
}
