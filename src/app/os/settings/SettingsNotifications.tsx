"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUserPreferencesAction } from "@/lib/db/actions/settings";

interface SettingsNotificationsProps {
  initialPreferences?: any;
}

export function SettingsNotifications({ initialPreferences }: SettingsNotificationsProps) {
  const [prefs, setPrefs] = useState(() => {
    const defaults = {
      taskAssigned: true,
      mentions: true,
      weeklyDigest: true,
    };
    return initialPreferences?.notifications 
      ? { ...defaults, ...initialPreferences.notifications }
      : defaults;
  });

  const handleSave = async () => {
    try {
      await updateUserPreferencesAction({ notifications: prefs });
      toast.success("Preferencias guardadas");
    } catch {
      toast.error("Error al guardar preferencias");
    }
  };

  return (
    <Card className="max-w-2xl bg-[var(--color-card)]">
      <CardHeader><CardTitle>Preferencias de notificaciones</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <label className="flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-muted)]/50 hover:bg-[var(--color-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.taskAssigned}
            onChange={(e) => setPrefs({ ...prefs, taskAssigned: e.target.checked })}
            className="mt-1 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <div>
            <p className="text-sm font-medium">Asignaciones de tareas</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Cuando alguien te asigne una nueva tarea.</p>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-muted)]/50 hover:bg-[var(--color-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.mentions}
            onChange={(e) => setPrefs({ ...prefs, mentions: e.target.checked })}
            className="mt-1 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <div>
            <p className="text-sm font-medium">Menciones y comentarios</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Cuando te mencionen con @ en un comentario o descripción.</p>
          </div>
        </label>
        <label className="flex items-start gap-3 p-3 border border-[var(--color-border)] rounded-lg bg-[var(--color-muted)]/50 hover:bg-[var(--color-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.weeklyDigest}
            onChange={(e) => setPrefs({ ...prefs, weeklyDigest: e.target.checked })}
            className="mt-1 rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
          />
          <div>
            <p className="text-sm font-medium">Resumen semanal (Email)</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">Recibe un digest cada viernes con las tareas completadas y metas.</p>
          </div>
        </label>
        <div className="pt-4 border-t border-[var(--color-border)]">
          <Button onClick={handleSave}>Guardar preferencias</Button>
        </div>
      </CardContent>
    </Card>
  );
}
