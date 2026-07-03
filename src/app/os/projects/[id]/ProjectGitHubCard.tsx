"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Star, GitFork, Calendar, ExternalLink, Unlink, Plus, Loader2 } from "lucide-react";
import { updateProjectGitHubRepoAction } from "@/lib/db/actions/projects";
import { toast } from "sonner";

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}


interface GitHubRepoData {
  url: string;
  owner: string;
  repoName: string;
  description: string | null;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  topics: string[];
  pushedAt: Date | null;
}

interface ProjectGitHubCardProps {
  projectId: string;
  repoUrl: string | null;
  repoData: GitHubRepoData | null;
}

export function ProjectGitHubCard({ projectId, repoUrl, repoData }: ProjectGitHubCardProps) {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsConnecting(true);
    try {
      // Validate it's a github url
      if (!inputUrl.toLowerCase().includes("github.com")) {
        toast.error("La URL debe ser un repositorio válido de GitHub");
        setIsConnecting(false);
        return;
      }

      await updateProjectGitHubRepoAction(projectId, inputUrl.trim());
      toast.success("Repositorio de GitHub conectado con éxito");
      setInputUrl("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al conectar el repositorio");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("¿Estás seguro de que deseas desconectar este repositorio del proyecto?")) return;

    setIsDisconnecting(true);
    try {
      await updateProjectGitHubRepoAction(projectId, null);
      toast.success("Repositorio de GitHub desconectado");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Error al desconectar el repositorio");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (!repoUrl) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Github className="h-4 w-4 text-muted-foreground" />
            Repositorio de GitHub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-4">
            Conecta un repositorio de GitHub para ver estadísticas de desarrollo, lenguajes, ramas e historial de cambios directamente en este proyecto.
          </p>
          <form onSubmit={handleConnect} className="flex gap-2">
            <Input
              type="url"
              placeholder="https://github.com/usuario/repo"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="h-9 text-xs bg-background"
              required
              disabled={isConnecting}
            />
            <Button type="submit" size="sm" className="h-9 px-3 shrink-0" disabled={isConnecting}>
              {isConnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1" />
              )}
              Conectar
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border bg-gradient-to-br from-background to-muted/25">
      <CardHeader className="pb-2 border-b border-border/40">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Github className="h-4 w-4 text-foreground" />
            Repositorio Conectado
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center justify-center rounded-md border border-border px-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors gap-1"
            >
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="h-7 px-2 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
              title="Desconectar repositorio"
            >
              {isDisconnecting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Unlink className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {repoData ? (
          <>
            <div>
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                {repoData.owner} / {repoData.repoName}
              </h4>
              {repoData.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {repoData.description}
                </p>
              )}
            </div>

            {/* Language and Stats */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              {repoData.language && (
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: repoData.languageColor || "#64748b" }}
                  />
                  <span className="font-medium text-foreground">{repoData.language}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500/90 fill-amber-500/20" />
                <span className="font-mono text-foreground font-medium">{repoData.stars}</span>
                <span>stars</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-3.5 w-3.5 text-blue-500/90" />
                <span className="font-mono text-foreground font-medium">{repoData.forks}</span>
                <span>forks</span>
              </div>
              {repoData.pushedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Push:</span>
                  <span className="text-foreground font-medium">
                    {new Date(repoData.pushedAt).toLocaleDateString("es-CO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Topics */}
            {repoData.topics && repoData.topics.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1.5">
                {repoData.topics.slice(0, 8).map((topic) => (
                  <span
                    key={topic}
                    className="inline-flex items-center rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/10"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="py-2">
            <p className="text-xs text-muted-foreground mb-1">
              Repositorio asociado: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{repoUrl}</code>
            </p>
            <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
              No se pudieron cargar las estadísticas del repositorio en este momento. Verifica la URL o tu token de GitHub de Vertrex.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
