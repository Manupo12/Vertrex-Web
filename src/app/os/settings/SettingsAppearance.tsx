"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateUserPreferencesAction } from "@/lib/db/actions/settings";

interface SettingsAppearanceProps {
  initialPreferences?: any;
}

export function SettingsAppearance({ initialPreferences }: SettingsAppearanceProps) {
  const [density, setDensity] = useState(initialPreferences?.appearance?.density || "comfortable");

  useEffect(() => {
    document.documentElement.style.setProperty("--table-row-height", density === "comfortable" ? "44px" : "32px");
  }, [density]);

  const handleApply = async () => {
    try {
      await updateUserPreferencesAction({ appearance: { density } });
      toast.success("Cambios aplicados");
    } catch {
      toast.error("Error al guardar apariencia");
    }
  };

  return (
    <Card className="max-w-2xl bg-[var(--color-card)]">
      <CardHeader><CardTitle>Apariencia y UI</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium mb-3">Densidad de listas (DataTable)</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="density"
                checked={density === "comfortable"}
                onChange={() => setDensity("comfortable")}
                className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm">Cómoda (44px)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="density"
                checked={density === "compact"}
                onChange={() => setDensity("compact")}
                className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <span className="text-sm">Compacta (32px)</span>
            </label>
          </div>
        </div>
        <div className="pt-4 border-t border-[var(--color-border)]">
          <Button onClick={handleApply}>Aplicar cambios</Button>
        </div>
      </CardContent>
    </Card>
  );
}
