"use client";

import { useState, useTransition } from "react";
import { Globe, Building2, Clock, Calendar, DollarSign } from "lucide-react";
import { updateSettingsBatch } from "@/lib/settings/settings-service";
import { showToast } from "@/components/ui/toast-container";

interface GeneralSettings {
  workspaceName: string;
  timezone: string;
  dateFormat: string;
  language: string;
  currency: string;
}

const defaultSettings: GeneralSettings = {
  workspaceName: "Vertrex Workspace",
  timezone: "America/Bogota",
  dateFormat: "DD/MM/YYYY",
  language: "es",
  currency: "COP",
};

const timezones = [
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/New_York", label: "Nueva York (GMT-5)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "UTC", label: "UTC" },
];

const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

const currencies = [
  { value: "COP", label: "Peso Colombiano (COP)" },
  { value: "USD", label: "US Dollar (USD)" },
  { value: "MXN", label: "Peso Mexicano (MXN)" },
  { value: "BRL", label: "Real Brasileño (BRL)" },
  { value: "EUR", label: "Euro (EUR)" },
];

const dateFormats = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

interface GeneralSettingsPanelProps {
  initialSettings?: Partial<GeneralSettings>;
}

export function GeneralSettingsPanel({ initialSettings }: GeneralSettingsPanelProps) {
  const [settings, setSettings] = useState<GeneralSettings>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof GeneralSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateSettingsBatch("general", settings as unknown as Record<string, unknown>);
      setSaved(true);
      showToast("Configuración general guardada", "success");
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Configuración General</h3>
          <p className="text-sm text-muted-foreground">
            Personaliza los ajustes básicos de tu workspace
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
          icon={Building2}
          title="Nombre del Workspace"
          description="Este nombre aparecerá en la interfaz y comunicaciones"
        >
          <input
            type="text"
            value={settings.workspaceName}
            onChange={(e) => handleChange("workspaceName", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            placeholder="Mi Workspace"
          />
        </SettingCard>

        <SettingCard
          icon={Globe}
          title="Idioma"
          description="Idioma de la interfaz del sistema"
        >
          <select
            value={settings.language}
            onChange={(e) => handleChange("language", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </SettingCard>

        <SettingCard
          icon={Clock}
          title="Zona Horaria"
          description="Usada para eventos, recordatorios y reportes"
        >
          <select
            value={settings.timezone}
            onChange={(e) => handleChange("timezone", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </SettingCard>

        <SettingCard
          icon={Calendar}
          title="Formato de Fecha"
          description="Cómo se muestran las fechas en todo el sistema"
        >
          <select
            value={settings.dateFormat}
            onChange={(e) => handleChange("dateFormat", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {dateFormats.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </SettingCard>

        <SettingCard
          icon={DollarSign}
          title="Moneda Principal"
          description="Moneda por defecto para transacciones y presupuestos"
        >
          <select
            value={settings.currency}
            onChange={(e) => handleChange("currency", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {currencies.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </SettingCard>
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
  icon: typeof Building2;
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
