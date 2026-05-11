"use client";
import { useState } from "react";
import { Search, Link2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { linkEntities } from "@/lib/db/actions/graph";
import { searchEntitiesAction, SearchResult } from "@/lib/db/actions/search";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EntityConnectSheetProps {
  sourceId: string;
  sourceType: EntityType;
}

export function EntityConnectSheet({ sourceId, sourceType }: EntityConnectSheetProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await searchEntitiesAction(q);
      setResults(res);
    } catch { setResults([]); }
    setSearching(false);
  };

  const handleConnect = async (targetId: string, targetType: string) => {
    try {
      await linkEntities(sourceId, sourceType, targetId, targetType as EntityType);
      toast.success("Conectado correctamente");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al conectar");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm"><Link2 className="mr-2 h-4 w-4" />Conectar</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Conectar entidad</SheetTitle>
          <SheetDescription>Busca una entidad para conectarla.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar entidad..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[70vh]">
            {searching && <p className="text-sm text-muted-foreground py-2 text-center">Buscando...</p>}
            {!searching && results.length === 0 && query.trim().length >= 2 && (
              <p className="text-sm text-muted-foreground py-2 text-center">Sin resultados.</p>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => handleConnect(r.id, r.type)}
                className="w-full flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <div className="flex flex-col max-w-[70%]">
                  <span className="font-semibold truncate text-foreground">{r.label}</span>
                  <span className="text-xs text-muted-foreground truncate">{r.subtitle}</span>
                </div>
                <Badge variant="neutral" className="ml-2">{r.type}</Badge>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
