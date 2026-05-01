"use client";

import { useEffect, useState, useTransition } from "react";
import { Shield, Key, Clock, Lock, Smartphone, History, AlertTriangle } from "lucide-react";
import { updateSettingsBatch } from "@/lib/settings/settings-service";
import { showToast } from "@/components/ui/toast-container";

interface SecuritySettings {
  twoFactorRequired: boolean;
  sessionTimeout: number;
  auditLogRetention: number;
}

const defaultSettings: SecuritySettings = {
  twoFactorRequired: false,
  sessionTimeout: 3600,
  auditLogRetention: 90,
};

export function SecuritySettingsPanel() {
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // 2FA real state
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  useEffect(() => {
    fetch("/api/2fa/status")
      .then((r) => r.json())
      .then((data) => setTotpEnabled(data.enabled))
      .catch(() => setTotpEnabled(false));
  }, []);

  const handleToggle = (key: keyof SecuritySettings) => {
    if (typeof settings[key] === "boolean") {
      setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
      setSaved(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateSettingsBatch("security", settings as unknown as Record<string, unknown>);
      setSaved(true);
      showToast("Configuración de seguridad guardada", "success");
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleSetup2FA = async () => {
    setTotpLoading(true);
    try {
      const res = await fetch("/api/2fa/setup");
      const data = await res.json();
      if (data.qrCodeUrl) {
        setTotpSetup({ secret: data.secret, qrCodeUrl: data.qrCodeUrl });
      }
    } catch {
      showToast("Error al generar QR de 2FA", "error");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (totpCode.length !== 6) {
      showToast("El código debe tener 6 dígitos", "error");
      return;
    }
    setTotpLoading(true);
    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: totpCode }),
      });
      const data = await res.json();
      if (data.ok) {
        setTotpEnabled(true);
        setTotpSetup(null);
        setTotpCode("");
        showToast("2FA activado correctamente", "success");
      } else {
        showToast("Código incorrecto. Intenta de nuevo.", "error");
      }
    } catch {
      showToast("Error al verificar código", "error");
    } finally {
      setTotpLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("¿Seguro que deseas desactivar 2FA? Tu cuenta será menos segura.")) return;
    setTotpLoading(true);
    try {
      const res = await fetch("/api/2fa/disable", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setTotpEnabled(false);
        setTotpSetup(null);
        showToast("2FA desactivado", "info");
      }
    } catch {
      showToast("Error al desactivar 2FA", "error");
    } finally {
      setTotpLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Seguridad</h3>
          <p className="text-sm text-muted-foreground">
            Protege tu cuenta y datos del workspace
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
          icon={Shield}
          title="Autenticación de Dos Factores"
          description="Protege tu cuenta con TOTP"
        >
          <div className="space-y-3">
            <ToggleItem
              icon={Smartphone}
              label="2FA activado"
              description="Autenticación de dos factores"
              enabled={totpEnabled}
              onToggle={() => {}}
            />
            {totpEnabled ? (
              <button
                onClick={handleDisable2FA}
                disabled={totpLoading}
                className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
              >
                {totpLoading ? "Procesando..." : "Desactivar 2FA"}
              </button>
            ) : totpSetup ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Escanea el QR con tu app de autenticación (Google Authenticator, Authy, etc.)
                </p>
                <img src={totpSetup.qrCodeUrl} alt="QR 2FA" className="mx-auto h-40 w-40 rounded-lg border" />
                <p className="text-xs text-center text-muted-foreground font-mono break-all">
                  {totpSetup.secret}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Código de 6 dígitos"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    onClick={handleVerify2FA}
                    disabled={totpLoading || totpCode.length !== 6}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {totpLoading ? "..." : "Verificar"}
                  </button>
                </div>
                <button
                  onClick={() => setTotpSetup(null)}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={handleSetup2FA}
                disabled={totpLoading}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {totpLoading ? "Generando..." : "Configurar mi 2FA"}
              </button>
            )}
          </div>
        </SettingCard>

        <SettingCard
          icon={Clock}
          title="Sesiones"
          description="Gestión de sesiones activas"
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Tiempo de expiración</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value={900}>15 minutos</option>
                <option value={1800}>30 minutos</option>
                <option value={3600}>1 hora</option>
                <option value={7200}>2 horas</option>
                <option value={14400}>4 horas</option>
                <option value={28800}>8 horas</option>
              </select>
            </div>
            <button className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">
              Cerrar todas las sesiones
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={History}
          title="Auditoría"
          description="Logs y retención de datos"
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">Retención de logs</label>
              <select
                value={settings.auditLogRetention}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, auditLogRetention: parseInt(e.target.value) }))
                }
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value={30}>30 días</option>
                <option value={90}>90 días</option>
                <option value={180}>6 meses</option>
                <option value={365}>1 año</option>
              </select>
            </div>
            <button className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
              Ver logs de auditoría
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={Lock}
          title="Contraseña"
          description="Gestiona tu contraseña actual"
        >
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña actual"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="password"
              placeholder="Nueva contraseña"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Cambiar contraseña
            </button>
          </div>
        </SettingCard>
      </div>

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <h4 className="font-medium text-destructive">Zona de Peligro</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Estas acciones son irreversibles. Ten cuidado.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20">
                Exportar todos los datos
              </button>
              <button className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-destructive/90">
                Eliminar cuenta
              </button>
            </div>
          </div>
        </div>
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
  icon: typeof Shield;
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
  icon: typeof Shield;
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
