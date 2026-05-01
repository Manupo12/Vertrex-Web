"use client";

import { useState, useTransition } from "react";
import { Plug, Calendar, MessageSquare, CreditCard, Mail, Check, AlertCircle } from "lucide-react";
import { updateSettingsBatch } from "@/lib/settings/settings-service";
import { showToast } from "@/components/ui/toast-container";

interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  icon: typeof Calendar;
  connected: boolean;
  email?: string;
  workspace?: string;
  accountId?: string;
  fromEmail?: string;
}

const integrations: IntegrationStatus[] = [
  {
    id: "googleCalendar",
    name: "Google Calendar",
    description: "Sincroniza eventos y reuniones",
    icon: Calendar,
    connected: false,
  },
  {
    id: "slack",
    name: "Slack",
    description: "Recibe notificaciones en canales",
    icon: MessageSquare,
    connected: false,
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Procesa pagos y suscripciones",
    icon: CreditCard,
    connected: false,
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Envía emails transaccionales",
    icon: Mail,
    connected: false,
  },
];

export function IntegrationsSettingsPanel() {
  const [items, setItems] = useState(integrations);
  const [isPending, startTransition] = useTransition();

  const handleConnect = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, connected: !item.connected } : item
      )
    );
    startTransition(async () => {
      const integration = items.find((i) => i.id === id);
      if (integration) {
        await updateSettingsBatch("integrations", { [id]: { connected: !integration.connected } } as Record<string, unknown>);
        showToast(`${integration.name} ${!integration.connected ? "conectado" : "desconectado"}`, "success");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Integraciones</h3>
        <p className="text-sm text-muted-foreground">
          Conecta Vertrex OS con tus herramientas favoritas
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onConnect={() => handleConnect(integration.id)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center">
        <Plug className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <h4 className="font-medium text-foreground">¿Necesitas más integraciones?</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Usa nuestra API para integraciones personalizadas o contacta soporte
        </p>
        <button className="mt-4 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
          Ver documentación API
        </button>
      </div>
    </div>
  );
}

function IntegrationCard({
  integration,
  onConnect,
}: {
  integration: IntegrationStatus;
  onConnect: () => void;
}) {
  const Icon = integration.icon;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{integration.name}</h4>
            <p className="text-xs text-muted-foreground">{integration.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {integration.connected ? (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <Check className="h-3 w-3" />
              Conectado
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Desconectado
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        {integration.connected ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {integration.email && `Cuenta: ${integration.email}`}
              {integration.workspace && `Workspace: ${integration.workspace}`}
            </p>
            <button
              onClick={onConnect}
              className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <button
            onClick={onConnect}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Conectar
          </button>
        )}
      </div>
    </div>
  );
}
