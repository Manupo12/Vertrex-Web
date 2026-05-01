"use client";

import { useState, useTransition } from "react";
import { Bell, Mail, Smartphone, Calendar, CheckSquare, Ticket, Megaphone } from "lucide-react";
import { updateSettingsBatch } from "@/lib/settings/settings-service";
import { showToast } from "@/components/ui/toast-container";

interface NotificationSettings {
  emailEnabled: boolean;
  browserEnabled: boolean;
  mobileEnabled: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  dealUpdates: boolean;
  taskAssignments: boolean;
  ticketMentions: boolean;
}

const defaultSettings: NotificationSettings = {
  emailEnabled: true,
  browserEnabled: true,
  mobileEnabled: false,
  dailyDigest: true,
  weeklyReport: true,
  dealUpdates: true,
  taskAssignments: true,
  ticketMentions: true,
};

interface NotificationsSettingsPanelProps {
  initialSettings?: Partial<NotificationSettings>;
}

export function NotificationsSettingsPanel({ initialSettings }: NotificationsSettingsPanelProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateSettingsBatch("notifications", settings as unknown as Record<string, unknown>);
      setSaved(true);
      showToast("Preferencias de notificación guardadas", "success");
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Preferencias de Notificación</h3>
          <p className="text-sm text-muted-foreground">
            Controla cómo y cuándo recibes notificaciones
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
          icon={Bell}
          title="Canales de Notificación"
          description="Elige cómo recibir tus alertas"
        >
          <div className="space-y-3">
            <ToggleItem
              icon={Mail}
              label="Notificaciones por email"
              description="Recibe resúmenes y alertas importantes"
              enabled={settings.emailEnabled}
              onToggle={() => handleToggle("emailEnabled")}
            />
            <ToggleItem
              icon={Bell}
              label="Notificaciones del navegador"
              description="Alertas en tiempo real en tu navegador"
              enabled={settings.browserEnabled}
              onToggle={() => handleToggle("browserEnabled")}
            />
            <ToggleItem
              icon={Smartphone}
              label="Notificaciones móviles"
              description="Push notifications en tu teléfono"
              enabled={settings.mobileEnabled}
              onToggle={() => handleToggle("mobileEnabled")}
            />
          </div>
        </SettingCard>

        <SettingCard
          icon={Megaphone}
          title="Resúmenes y Reportes"
          description="Frecuencia de emails de resumen"
        >
          <div className="space-y-3">
            <ToggleItem
              icon={Calendar}
              label="Resumen diario"
              description="Tus tareas y eventos del día"
              enabled={settings.dailyDigest}
              onToggle={() => handleToggle("dailyDigest")}
            />
            <ToggleItem
              icon={Calendar}
              label="Reporte semanal"
              description="Resumen de la semana con métricas"
              enabled={settings.weeklyReport}
              onToggle={() => handleToggle("weeklyReport")}
            />
          </div>
        </SettingCard>

        <SettingCard
          icon={CheckSquare}
          title="Actividad Operativa"
          description="Notificaciones sobre tu trabajo"
        >
          <div className="space-y-3">
            <ToggleItem
              icon={Megaphone}
              label="Actualizaciones de deals"
              description="Cambios en el pipeline de ventas"
              enabled={settings.dealUpdates}
              onToggle={() => handleToggle("dealUpdates")}
            />
            <ToggleItem
              icon={CheckSquare}
              label="Asignaciones de tareas"
              description="Cuando te asignan una tarea"
              enabled={settings.taskAssignments}
              onToggle={() => handleToggle("taskAssignments")}
            />
            <ToggleItem
              icon={Ticket}
              label="Menciones en tickets"
              description="Cuando alguien te menciona en un ticket"
              enabled={settings.ticketMentions}
              onToggle={() => handleToggle("ticketMentions")}
            />
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

function ToggleItem({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          enabled ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-background transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function SettingCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Bell;
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
