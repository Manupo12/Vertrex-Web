"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { HashIcon, CopyIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function HashtagsView({ hashtags, accounts }: { hashtags: any[], accounts: any[] }) {
  if (hashtags.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={HashIcon} 
          title="Sin hashtags guardados" 
          description="Crea tu primer grupo de hashtags para reutilizar fácilmente." 
        />
      </div>
    );
  }

  const handleCopy = (tags: string[]) => {
    navigator.clipboard.writeText(tags.join(" "));
    toast.success("Hashtags copiados al portapapeles");
  };

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hashtags.map(h => {
        const account = accounts.find(a => a.id === h.accountId);
        const tagsList = h.tags || [];
        
        return (
          <div key={h.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 hover:border-[var(--color-primary)]/50 transition-colors flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{h.label}</h3>
                {account && <p className="text-xs text-[var(--color-muted-foreground)]">Para: {account.handle}</p>}
              </div>
              <span className="text-xs bg-[var(--color-muted)] px-2 py-1 rounded-full font-medium">
                {tagsList.length} tags
              </span>
            </div>
            
            <div className="flex-1 mb-6">
              <div className="flex flex-wrap gap-2">
                {tagsList.map((tag: string, i: number) => (
                  <span key={i} className="text-xs text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)] mt-auto">
              <Button variant="outline" size="sm" onClick={() => handleCopy(tagsList)}>
                <CopyIcon className="h-4 w-4 mr-2" /> Copiar todos
              </Button>
              <Button variant="ghost" size="sm" className="text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)]">
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
