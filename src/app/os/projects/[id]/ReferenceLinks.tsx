"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addProjectReferenceLinkAction, removeProjectReferenceLinkAction } from "@/lib/db/actions/projects";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink } from "lucide-react";

interface ReferenceLinksProps {
  projectId: string;
  links: Array<{ label: string; url: string }>;
}

export function ReferenceLinks({ projectId, links }: ReferenceLinksProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Links de referencia</h3>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}><Plus className="mr-1 h-3.5 w-3.5" />A&ntilde;adir link</Button>
      </div>
      {showAdd && (
        <form action={async (fd) => { await addProjectReferenceLinkAction(projectId, String(fd.get("label")), String(fd.get("url"))); setShowAdd(false); toast.success("Link a&ntilde;adido"); }} className="flex gap-2">
          <input name="label" placeholder="Etiqueta" required className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input name="url" placeholder="URL" required className="flex-[2] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button type="submit" size="sm">A&ntilde;adir</Button>
        </form>
      )}
      <div className="space-y-1">
        {links.map((link, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <a href={link.url} target="_blank" rel="noopener" className="flex items-center gap-2 text-foreground hover:text-primary"><ExternalLink className="h-3.5 w-3.5" />{link.label}</a>
            <form action={async () => { await removeProjectReferenceLinkAction(projectId, i); toast.success("Link eliminado"); }}>
              <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
            </form>
          </div>
        ))}
        {links.length === 0 && !showAdd && <p className="text-xs text-muted-foreground">Sin links de referencia.</p>}
      </div>
    </div>
  );
}
