"use client";

import { useState, useTransition } from "react";
import { Building2, Receipt, CreditCard, Mail, Phone, Landmark } from "lucide-react";
import { updateSettingsBatch } from "@/lib/settings/settings-service";
import { showToast } from "@/components/ui/toast-container";

interface BillingSettings {
  companyName: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
  bankName: string;
  bankAccount: string;
  paymentTerms: number;
}

const defaultSettings: BillingSettings = {
  companyName: "",
  taxId: "",
  address: "",
  email: "",
  phone: "",
  bankName: "",
  bankAccount: "",
  paymentTerms: 30,
};

interface BillingSettingsPanelProps {
  initialSettings?: Partial<BillingSettings>;
}

export function BillingSettingsPanel({ initialSettings }: BillingSettingsPanelProps) {
  const [settings, setSettings] = useState<BillingSettings>({
    ...defaultSettings,
    ...initialSettings,
  });
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof BillingSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateSettingsBatch("billing", settings as unknown as Record<string, unknown>);
      setSaved(true);
      showToast("Datos de facturación guardados", "success");
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Información de Facturación</h3>
          <p className="text-sm text-muted-foreground">
            Datos que aparecerán en facturas y documentos legales
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
          title="Datos de la Empresa"
          description="Información legal de tu empresa"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={settings.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
              placeholder="NIT / Tax ID"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <textarea
              value={settings.address}
              onChange={(e) => handleChange("address", e.target.value)}
              placeholder="Dirección completa"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none resize-none"
            />
          </div>
        </SettingCard>

        <SettingCard
          icon={Receipt}
          title="Contacto de Facturación"
          description="Datos de contacto para facturas"
        >
          <div className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Email de facturación"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Teléfono de contacto"
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </SettingCard>

        <SettingCard
          icon={Landmark}
          title="Información Bancaria"
          description="Datos para transferencias y pagos"
        >
          <div className="space-y-3">
            <input
              type="text"
              value={settings.bankName}
              onChange={(e) => handleChange("bankName", e.target.value)}
              placeholder="Nombre del banco"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="text"
              value={settings.bankAccount}
              onChange={(e) => handleChange("bankAccount", e.target.value)}
              placeholder="Número de cuenta"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </SettingCard>

        <SettingCard
          icon={CreditCard}
          title="Términos de Pago"
          description="Configuración de plazos de pago"
        >
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Días para pago:</label>
            <select
              value={settings.paymentTerms}
              onChange={(e) => handleChange("paymentTerms", parseInt(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
              <option value={45}>45 días</option>
              <option value={60}>60 días</option>
            </select>
          </div>
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
