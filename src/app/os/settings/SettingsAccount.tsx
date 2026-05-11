"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { changePasswordAction } from "@/lib/db/actions/settings";

export function SettingsAccount() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("Completa todos los campos"); return; }
    setLoading(true);
    try {
      await changePasswordAction(currentPassword, newPassword);
      toast.success("Contrasena actualizada");
      setCurrentPassword(""); setNewPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar contrasena");
    }
    setLoading(false);
  };

  return (
    <Card><CardHeader><CardTitle>Cambiar contrasena</CardTitle></CardHeader><CardContent>
      <div className="space-y-4">
        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Contrasena actual</label><input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
        <div><label className="block text-sm font-medium text-muted-foreground mb-1">Nueva contrasena</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
        <Button onClick={handleChangePassword} disabled={loading}>{loading ? "Actualizando..." : "Actualizar contrasena"}</Button>
      </div>
    </CardContent></Card>
  );
}
