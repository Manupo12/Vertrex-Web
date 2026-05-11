"use client";

import { formatShortDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { GitFork, Star, Pin } from "lucide-react";
import { useRouter } from "next/navigation";

export interface GithubCardProps {
  repo: {
    id: string;
    owner: string;
    repoName: string;
    description: string | null;
    language: string | null;
    languageColor: string | null;
    stars: number;
    forks: number;
    pushedAt: Date | null;
    savedReason: string;
    implementationStatus: string;
    priority: number;
  };
}

export function GithubCard({ repo }: GithubCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/os/links/${repo.id}?type=repo`)} 
      className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors hover:border-primary/30"
    >
      <p className="font-semibold text-sm">{repo.owner}/{repo.repoName}</p>
      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5 mb-2">{repo.description}</p>
      {repo.language && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: repo.languageColor || "#64748b" }} />
          <span className="text-[10px] text-muted-foreground">{repo.language}</span>
        </div>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{repo.stars}</span>
        <span className="flex items-center gap-1"><GitFork className="h-3 w-3" />{repo.forks}</span>
        {repo.pushedAt && <span>{formatShortDate(repo.pushedAt)}</span>}
      </div>
      <div className="rounded-md bg-accent/30 px-2 py-1.5 text-xs text-foreground flex items-start gap-1.5">
        <Pin className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
        <span className="line-clamp-2">{repo.savedReason}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <StatusBadge category="repo" status={repo.implementationStatus} />
        <span className="text-[10px] text-muted-foreground ml-auto">
          {"★".repeat(repo.priority)}{"☆".repeat(5 - repo.priority)}
        </span>
      </div>
    </div>
  );
}
