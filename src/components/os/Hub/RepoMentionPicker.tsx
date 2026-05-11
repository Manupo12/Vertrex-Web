"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { searchEntitiesAction, SearchResult } from "@/lib/db/actions/search";

export function RepoMentionPicker({ open, onClose, onSelect }: { open: boolean, onClose: () => void, onSelect: (repo: SearchResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); return; }
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        const res = await searchEntitiesAction(query);
        setResults(res.filter(r => r.type === "repository"));
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mencionar repositorio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar repositorio..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[40vh]">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{r.label}</span>
                  <span className="text-xs text-muted-foreground">{r.subtitle}</span>
                </div>
              </button>
            ))}
            {query.length >= 2 && results.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No se encontraron repositorios.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}