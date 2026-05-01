"use client";

import { useState, useEffect } from "react";
import { BookOpen, Search, Plus, ThumbsUp, Eye, Tag } from "lucide-react";
import { getKbArticles, searchKbArticles, createKbArticle, markArticleHelpful, type KbArticle, type KbCategory } from "@/lib/kb/knowledge-base-service";
import { EmptyWorkspacePanel, LoadingWorkspacePanel, formatDateTime } from "@/components/os/workspace-ui";

const categories: { id: KbCategory; label: string }[] = [
  { id: "general", label: "General" },
  { id: "technical", label: "Técnico" },
  { id: "billing", label: "Facturación" },
  { id: "onboarding", label: "Onboarding" },
  { id: "faq", label: "FAQ" },
];

export default function KbWorkspaceScreen() {
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<KbCategory | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: "", content: "", category: "general" as KbCategory, tags: "" });

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getKbArticles(selectedCategory ?? undefined);
      setArticles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadArticles();
      return;
    }
    setLoading(true);
    try {
      const data = await searchKbArticles(searchQuery);
      setArticles(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createKbArticle({
      title: newArticle.title,
      content: newArticle.content,
      category: newArticle.category,
      tags: newArticle.tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setShowCreateForm(false);
    setNewArticle({ title: "", content: "", category: "general", tags: "" });
    await loadArticles();
  };

  const handleHelpful = async (id: string) => {
    await markArticleHelpful(id);
    await loadArticles();
  };

  if (loading) {
    return <LoadingWorkspacePanel label="Cargando knowledge base..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Knowledge Base</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Centro de ayuda y documentación interna para el equipo y clientes.
          </p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus className="h-4 w-4" /> Nuevo artículo
        </button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${selectedCategory === null ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:bg-secondary/80"}`}
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "border border-border bg-secondary text-foreground hover:bg-secondary/80"}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="text-lg font-semibold">Nuevo artículo</h3>
          <input
            type="text"
            placeholder="Título"
            value={newArticle.title}
            onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <textarea
            placeholder="Contenido"
            value={newArticle.content}
            onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <select
            value={newArticle.category}
            onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value as KbCategory })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tags (separados por coma)"
            value={newArticle.tags}
            onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-3">
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Crear artículo
            </button>
            <button type="button" className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm" onClick={() => setShowCreateForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {articles.length === 0 ? (
        <EmptyWorkspacePanel
          title="Sin artículos aún"
          description="Crea el primer artículo de la knowledge base para empezar a documentar procesos y respuestas frecuentes."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="rounded-2xl border border-border bg-card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium uppercase">
                  {categories.find((c) => c.id === article.category)?.label ?? article.category}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {article.viewCount}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{article.content}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {article.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-secondary/50 px-2 py-0.5 text-[10px]">
                    <Tag className="h-2.5 w-2.5" /> {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground">{formatDateTime(article.updatedAt.toISOString())}</span>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => handleHelpful(article.id)}
                >
                  <ThumbsUp className="h-3.5 w-3.5" /> {article.helpfulCount}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
