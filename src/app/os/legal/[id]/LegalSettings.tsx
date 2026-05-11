"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateLegalSettingsAction } from "@/lib/db/actions/legal";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export function LegalSettings({ doc }: { doc: { id: string, type: string, signedAt: Date | null, isPublic: boolean, createdAt: Date } }) {
  const [isPublic, setIsPublic] = useState(doc.isPublic);
  const [signedAtDate, setSignedAtDate] = useState(doc.signedAt ? new Date(doc.signedAt).toISOString().split("T")[0] : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLegalSettingsAction(doc.id, isPublic, signedAtDate || null);
      toast.success("Actualizado");
    } catch {
      toast.error("Error al actualizar");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="text-sm">Configuracion</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Firmado el</span>
          <input type="date" value={signedAtDate} onChange={(e) => setSignedAtDate(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Exponer en portal</span>
            {isPublic ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
          </div>
          <Button variant={isPublic ? "danger" : "primary"} size="sm" onClick={() => setIsPublic(!isPublic)}>
            {isPublic ? "Ocultar" : "Exponer"}
          </Button>
        </div>
        <Button className="w-full mt-4" onClick={handleSave} disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
      </CardContent></Card>
    </div>
  );
}