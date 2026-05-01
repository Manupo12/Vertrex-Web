import { 
  Settings as SettingsIcon, Users, Shield, 
  CreditCard, Blocks, Zap, Bell, Cpu
} from "lucide-react";

import { AccessSettingsPanel } from "@/components/settings/access-settings-panel";
import { GeneralSettingsPanel } from "@/components/settings/general-settings-panel";
import { BillingSettingsPanel } from "@/components/settings/billing-settings-panel";
import { NotificationsSettingsPanel } from "@/components/settings/notifications-settings-panel";
import { IntegrationsSettingsPanel } from "@/components/settings/integrations-settings-panel";
import { SecuritySettingsPanel } from "@/components/settings/security-settings-panel";
import { AdvancedSettingsPanel } from "@/components/settings/advanced-settings-panel";
import { getAccessManagementSnapshot } from "@/lib/admin/access-service";
import { getSettingsByCategory } from "@/lib/settings/settings-service";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const snapshot = await getAccessManagementSnapshot();
  const params = searchParams ? await searchParams : { tab: "access" };
  const { tab = "access" } = params;

  const generalSettings = await getSettingsByCategory("general");
  const billingSettings = await getSettingsByCategory("billing");
  const notificationsSettings = await getSettingsByCategory("notifications");

  const tabs = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "access", label: "Miembros y Roles", icon: Users },
    { id: "billing", label: "Facturación", icon: CreditCard },
    { id: "notifications", label: "Notificaciones", icon: Bell },
    { id: "integrations", label: "Integraciones", icon: Blocks },
    { id: "security", label: "Seguridad", icon: Shield },
    { id: "advanced", label: "Avanzado", icon: Cpu },
  ];

  const activeTab = tabs.find((t) => t.id === tab) || tabs[1];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8 animate-fade-in pb-4">
      
      {/* 1. SIDEBAR: NAVEGACIÓN DE CONFIGURACIÓN */}
      <aside className="w-[240px] shrink-0 flex flex-col gap-6 overflow-y-auto no-scrollbar">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2 mb-1">
            Configuración
          </h1>
          <p className="text-xs text-muted-foreground">Administración de Vertrex OS</p>
        </div>

        <nav className="space-y-1">
          {tabs.map((t) => (
            <SettingsNavItem
              key={t.id}
              icon={t.icon}
              label={t.label}
              href={`/os/settings?tab=${t.id}`}
              active={tab === t.id}
            />
          ))}
        </nav>
      </aside>

      {/* 2. ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-8">
        {/* Header de la Vista Principal */}
        <div className="border-b border-border pb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{activeTab.label}</h2>
            <p className="text-sm text-muted-foreground mt-1">{getTabDescription(tab)}</p>
          </div>
        </div>

        {/* Render panel según tab activo */}
        {tab === "general" && <GeneralSettingsPanel initialSettings={generalSettings} />}
        {tab === "access" && <AccessSettingsPanel initialSnapshot={snapshot} />}
        {tab === "billing" && <BillingSettingsPanel initialSettings={billingSettings} />}
        {tab === "notifications" && <NotificationsSettingsPanel initialSettings={notificationsSettings} />}
        {tab === "integrations" && <IntegrationsSettingsPanel />}
        {tab === "security" && <SecuritySettingsPanel />}
        {tab === "advanced" && <AdvancedSettingsPanel />}

      </main>
    </div>
  );
}

function getTabDescription(tab?: string): string {
  switch (tab) {
    case "general":
      return "Configuración básica del workspace: nombre, idioma, moneda, zona horaria";
    case "access":
      return "Gestiona accesos reales, clientes activos y overrides manuales de las cards públicas";
    case "billing":
      return "Datos de facturación de la empresa, información bancaria y términos de pago";
    case "notifications":
      return "Controla cómo y cuándo recibes notificaciones del sistema";
    case "integrations":
      return "Conecta Vertrex OS con tus herramientas favoritas";
    case "security":
      return "Configura autenticación de dos factores, sesiones y auditoría";
    case "advanced":
      return "Opciones avanzadas: API keys, webhooks y configuración técnica";
    default:
      return "Gestiona accesos reales, clientes activos y overrides manuales";
  }
}

function SettingsNavItem({ 
  icon: Icon, 
  label, 
  href, 
  active 
}: { 
  icon: typeof SettingsIcon; 
  label: string; 
  href: string;
  active?: boolean;
}) {
  return (
    <a 
      href={href}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
        active 
          ? "bg-primary/10 text-primary font-medium border border-primary/20" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </a>
  );
}