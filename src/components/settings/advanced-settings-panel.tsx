"use client";

import { useState, useTransition } from "react";
import { Settings, Key, Webhook, Globe, Download, Database, Trash2 } from "lucide-react";
import { updateSettingsBatch } from "@/lib/settings/settings-service";
import { showToast } from "@/components/ui/toast-container";

interface AdvancedSettings {
  apiKey: string | null;
  webhookUrl: string | null;
  customDomain: string | null;
  exportEnabled: boolean;
}

const defaultSettings: AdvancedSettings = {
  apiKey: null,
  webhookUrl: null,
  customDomain: null,
  exportEnabled: true,
};

export function AdvancedSettingsPanel() {
  const [settings, setSettings] = useState<AdvancedSettings>(defaultSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleChange = (key: keyof AdvancedSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateSettingsBatch("advanced", settings as unknown as Record<string, unknown>);
      setSaved(true);
      showToast("Configuración avanzada guardada", "success");
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const generateApiKey = () => {
    const newKey = `vrx_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
    setSettings((prev) => ({ ...prev, apiKey: newKey }));
    setSaved(false);
  };

  const regenerateApiKey = () => {
    if (confirm("¿Estás seguro? Esto invalidará la API key anterior.")) {
      generateApiKey();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configuración Avanzada</h3>
          <p className="text-sm text-muted-foreground">
            Opciones avanzadas para desarrolladores y administradores
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : saved ? "Guardado!" : "Guardar cambios"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SettingCard
          icon={Key}
          title="API Key"
          description="Usa esta key para acceder a la API de Vertrex"
        >
          <div className="space-y-3">
            {settings.apiKey ? (
              <>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={settings.apiKey}
                    readOnly
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-20 text-sm text-foreground font-mono"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1.5 rounded border border-border bg-secondary px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(settings.apiKey!)}
                    className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Copiar
                  </button>
                  <button
                    onClick={regenerateApiKey}
                    className="flex-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                  >
                    Regenerar
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={generateApiKey}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Generar API Key
              </button>
            )}
          </div>
        </SettingCard>

        <SettingCard
          icon={Webhook}
          title="Webhook URL"
          description="Recibe notificaciones en tiempo real"
        >
          <div className="space-y-3">
            <input
              type="url"
              value={settings.webhookUrl || ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))
              }
              placeholder="https://tu-servidor.com/webhook"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <button className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              Probar webhook
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={Globe}
          title="Dominio Personalizado"
          description="Configura tu propio dominio para el OS"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={settings.customDomain || ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, customDomain: e.target.value }))
              }
              placeholder="os.tu-empresa.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              Requiere configuración DNS. Contacta soporte para ayuda.
            </p>
          </div>
        </SettingCard>

        <SettingCard
          icon={Database}
          title="Gestión de Datos"
          description="Exporta o limpia datos del workspace"
        >
          <div className="space-y-3">
            <button className="flex w-full items-center gap-2 rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              <Download className="h-4 w-4" />
              Exportar todos los datos (JSON)
            </button>
            <button className="flex w-full items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">
              <Trash2 className="h-4 w-4" />
              Limpiar datos de prueba
            </button>
          </div>
        </SettingCard>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="font-medium text-foreground">Información del Sistema</h4>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Versión de Vertrex OS</span>
            <span className="font-mono text-foreground">v9.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última actualización</span>
            <span className="text-foreground">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entorno</span>
            <span className="rounded bg-secondary px-2 py-0.5 text-xs text-foreground">
              {process.env.NODE_ENV || "development"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-secondary p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="font-medium text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
