"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toolbar } from "@/components/os/layout/Toolbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Megaphone, Plus } from "lucide-react";
import { createSocialAccountAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";

const PLATFORMS: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", linkedin: "LinkedIn", twitter: "Twitter", youtube: "YouTube" };

export function MarketingView({ accounts, plans }: { accounts: Array<{ id: string; platform: string; handle: string; notes: string | null }>; plans: Array<{ id: string; socialAccountId: string; title: string; contentType: string; status: string }> }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await createSocialAccountAction(fd);
      setAddOpen(false);
      toast.success("Cuenta anadida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al anadir cuenta");
    }
    setSaving(false);
  };

  const filtered = accounts.filter(a => !query || a.handle.toLowerCase().includes(query.toLowerCase()) || a.platform.toLowerCase().includes(query.toLowerCase()));

  const NewAccountDialog = () => (
    <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva cuenta social</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Plataforma *</label>
            <select name="platform" required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Handle/Usuario *</label><Input name="handle" required placeholder="@vertrex" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Email asociado</label><Input name="email" type="email" placeholder="marketing@vertrex.com" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Contrasena (opcional)</label><Input name="password" type="password" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Notas</label><Input name="notes" placeholder="Notas internas..." /></div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Guardando..." : "Anadir cuenta"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (accounts.length === 0) {
    return (
      <div>
        <EmptyState icon={Megaphone} title="Sin cuentas" description="Conecta tus redes sociales." actionLabel="Anadir cuenta" onAction={() => setAddOpen(true)} />
        <NewAccountDialog />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />Nueva cuenta</Button>
      </div>
      <Toolbar searchPlaceholder="Buscar cuentas..." onSearch={setQuery} resultCount={filtered.length} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {filtered.map(a => (
          <div key={a.id} onClick={() => router.push(`/os/marketing/${a.id}`)} className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:bg-accent/30 transition-colors">
            <p className="text-lg font-semibold">{PLATFORMS[a.platform] || a.platform}</p>
            <p className="text-sm text-muted-foreground">@{a.handle}</p>
            {a.notes && <p className="text-xs text-muted-foreground line-clamp-2 mt-2">{a.notes}</p>}
            <Badge variant="neutral" className="mt-2 text-[10px]">{plans.filter(p => p.socialAccountId === a.id).length} contenidos</Badge>
          </div>
        ))}
      </div>
      <NewAccountDialog />
    </div>
  );
}
