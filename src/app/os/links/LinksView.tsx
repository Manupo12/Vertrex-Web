"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GitFork, Star, Link2, Pin } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { saveExternalReferenceAction } from "@/lib/db/actions/links";
import { toast } from "sonner";
import Image from "next/image";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Repo = { id: string; url: string; repoName: string; owner: string; description: string | null; language: string | null; languageColor: string | null; stars: number; forks: number; topics: string[]; pushedAt: Date | null; savedReason: string; implementationStatus: string; priority: number };
type LinkItem = { id: string; url: string; title: string | null; description: string | null; imageUrl: string | null; type: string };

export function LinksView({ repos, links }: { repos: Repo[]; links: LinkItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [savedReason, setSavedReason] = useState("");
  const [isGitHub, setIsGitHub] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredRepos = repos.filter(r => {
    if (languageFilter && languageFilter !== "all" && r.language?.toLowerCase() !== languageFilter.toLowerCase()) return false;
    if (topicFilter && topicFilter !== "all" && !r.topics.includes(topicFilter)) return false;
    if (statusFilter && statusFilter !== "all" && r.implementationStatus !== statusFilter) return false;
    if (priorityFilter && priorityFilter !== "all" && r.priority < parseInt(priorityFilter)) return false;
    if (query && !r.repoName.toLowerCase().includes(query.toLowerCase()) && !r.description?.toLowerCase().includes(query.toLowerCase()) && !r.savedReason.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const filteredLinks = links.filter(l => !query || l.title?.toLowerCase().includes(query.toLowerCase()) || l.description?.toLowerCase().includes(query.toLowerCase()));

  const handleUrlChange = (u: string) => {
    setUrl(u);
    setIsGitHub(u.includes("github.com/") && u.split("/").filter(Boolean).length >= 3);
  };

  const handleSave = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try {
      const result = await saveExternalReferenceAction(url, isGitHub ? savedReason : undefined);
      toast.success(result.type === "repository" ? "Repositorio guardado" : "Link guardado");
      setAddOpen(false); setUrl(""); setSavedReason("");
      router.refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    setSaving(false);
  };

  if (repos.length === 0 && links.length === 0) {
    return (
      <div>
        <EmptyState icon={Link2} title="Sin links guardados" description="Guarda repositorios GitHub y links utiles." actionLabel="Guardar link" onAction={() => setAddOpen(true)} />
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent><DialogHeader><DialogTitle>Guardar link</DialogTitle></DialogHeader>
            <div className="space-y-4"><div><label className="block text-sm font-medium text-muted-foreground mb-1">URL *</label><Input value={url} onChange={e => handleUrlChange(e.target.value)} /></div>
            {isGitHub && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Que problema te resuelve este repo? *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["Estudiar c\u00f3digo", "Implementar en proyecto actual", "Inspiraci\u00f3n", "Referencia de arquitectura"].map(tag => (
                    <Button 
                      key={tag} 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => setSavedReason(tag)}
                      className="text-[10px] h-7 px-2"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                <Textarea value={savedReason} onChange={e => setSavedReason(e.target.value)} rows={3} placeholder="O elige un bot\u00f3n arriba..." />
              </div>
            </div>
          )}
            <Button onClick={handleSave} disabled={saving || !url.trim() || (isGitHub && !savedReason.trim())} className="w-full">{saving ? "Guardando..." : "Guardar"}</Button></div></DialogContent>
        </Dialog>
      </div>
    );
  }

  const uniqueLanguages = Array.from(new Set(repos.map(r => r.language).filter(Boolean))) as string[];
  const uniqueTopics = Array.from(new Set(repos.flatMap(r => r.topics || []))).sort();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>+ Guardar link</Button></div>
      <Toolbar searchPlaceholder="Buscar en repos y links..." onSearch={setQuery} resultCount={filteredRepos.length + filteredLinks.length} filters={
        <div className="flex flex-wrap gap-2">
          <Select value={languageFilter} onValueChange={setLanguageFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Lenguaje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueLanguages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {uniqueTopics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="probando">Probando</SelectItem>
              <SelectItem value="en_uso">En uso</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquiera</SelectItem>
              <SelectItem value="3">3+ estrellas</SelectItem>
              <SelectItem value="4">4+ estrellas</SelectItem>
              <SelectItem value="5">5 estrellas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      } />

      {filteredRepos.length > 0 && (
        <div className="mb-6"><h2 className="text-sm font-medium mb-3">Repositorios GitHub ({filteredRepos.length})</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRepos.map(r => (
              <div key={r.id} onClick={() => router.push(`/os/links/${r.id}?type=repo`)} className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors hover:border-primary/30">
                <p className="font-semibold text-sm">{r.owner}/{r.repoName}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 mb-2">{r.description}</p>
                {r.language && <div className="flex items-center gap-1.5 mb-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.languageColor || "#64748b" }} /><span className="text-[10px] text-muted-foreground">{r.language}</span></div>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2"><span className="flex items-center gap-1"><Star className="h-3 w-3" />{r.stars}</span><span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{r.forks}</span>{r.pushedAt && <span>{formatShortDate(r.pushedAt)}</span>}</div>
                <div className="rounded-md bg-accent/30 px-2 py-1.5 text-xs text-foreground flex items-start gap-1.5"><Pin className="h-3 w-3 shrink-0 mt-0.5 text-primary" /><span className="line-clamp-2">{r.savedReason}</span></div>
                <div className="flex items-center gap-2 mt-2"><StatusBadge category="repo" status={r.implementationStatus} /><span className="text-[10px] text-muted-foreground ml-auto">{"★".repeat(r.priority)}{"☆".repeat(5 - r.priority)}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredLinks.length > 0 && (
        <div><h2 className="text-sm font-medium mb-3">Links ({filteredLinks.length})</h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLinks.map(l => (
              <div key={l.id} onClick={() => router.push(`/os/links/${l.id}?type=link`)} className="cursor-pointer rounded-xl border border-border bg-card p-3 hover:bg-accent/30 transition-colors">
                {l.imageUrl && (
                  <div className="relative mb-2 h-32 w-full">
                    <Image src={l.imageUrl} alt="" fill className="rounded-lg object-cover" unoptimized />
                  </div>
                )}
                <p className="font-medium text-sm line-clamp-1">{l.title || l.url}</p>
                {l.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{l.description}</p>}
                <Badge variant="neutral" className="text-[10px] mt-2">{l.type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent><DialogHeader><DialogTitle>Guardar link</DialogTitle></DialogHeader>
          <div className="space-y-4"><div><label className="block text-sm font-medium text-muted-foreground mb-1">URL *</label><Input value={url} onChange={e => handleUrlChange(e.target.value)} /></div>
          {isGitHub && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Que problema te resuelve este repo? *</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {["Estudiar c\u00f3digo", "Implementar en proyecto actual", "Inspiraci\u00f3n", "Referencia de arquitectura"].map(tag => (
                    <Button 
                      key={tag} 
                      variant="outline" 
                      size="sm" 
                      type="button"
                      onClick={() => setSavedReason(tag)}
                      className="text-[10px] h-7 px-2"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
                <Textarea value={savedReason} onChange={e => setSavedReason(e.target.value)} rows={3} placeholder="O elige un bot\u00f3n arriba..." />
              </div>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving || !url.trim() || (isGitHub && !savedReason.trim())} className="w-full">{saving ? "Guardando..." : "Guardar"}</Button></div></DialogContent>
      </Dialog>
    </div>
  );
}
