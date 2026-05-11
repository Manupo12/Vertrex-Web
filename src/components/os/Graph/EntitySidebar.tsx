import { getResolvedEntityConnections } from "@/lib/db/actions/graph";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface EntitySidebarProps {
  entityId: string;
}

export async function EntitySidebar({ entityId }: EntitySidebarProps) {
  const connections = await getResolvedEntityConnections(entityId);

  const grouped = new Map<string, typeof connections>();
  for (const link of connections) {
    const existing = grouped.get(link.type) || [];
    existing.push(link);
    grouped.set(link.type, existing);
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Conexiones</CardTitle></CardHeader>
        <CardContent><p className="text-xs text-muted-foreground">Sin conexiones aun.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Conexiones ({connections.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {Array.from(grouped.entries()).map(([type, links]) => (
          <div key={type}>
            <Badge variant="neutral" className="mb-1.5 text-[10px] capitalize">{type}</Badge>
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.linkId} className="flex items-center justify-between rounded-md border border-border bg-background p-2 group">
                  <div className="flex flex-col max-w-[80%]">
                    <span className="text-sm font-medium truncate" title={link.label}>{link.label}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{link.subtitle}</span>
                  </div>
                  <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
