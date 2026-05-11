"use client";
import { useState } from "react";
import { toast } from "sonner";

export function AccountForm({ clientName, userName, userEmail, portalUserId }: { clientName: string; userName: string; userEmail: string; portalUserId: string }) {
  const [approvals, setApprovals] = useState(true);
  const [comments, setComments] = useState(true);
  const [weekly, setWeekly] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { updatePortalPreferencesAction } = await import("./actions");
      await updatePortalPreferencesAction(portalUserId, { approvals, comments, weekly });
      toast.success("Preferencias guardadas");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
        <p className="text-muted-foreground text-lg">Preferencias y datos de acceso.</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-8">
        <h2 className="text-xl font-semibold mb-6">Datos de perfil</h2>
        <div className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
            <input type="text" value={clientName} disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input type="text" value={userName} disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" value={userEmail} disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-gray-500" />
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-6">Preferencias de notificaciones</h2>
          <div className="space-y-4">
            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={approvals} onChange={e => setApprovals(e.target.checked)} className="mt-1 w-5 h-5 rounded text-green-600 focus:ring-green-600" />
              <div>
                <p className="font-medium text-gray-900">Aprobaciones y firmas</p>
                <p className="text-sm text-gray-500">Recibe un correo cuando necesitemos tu firma o aprobación en un documento.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={comments} onChange={e => setComments(e.target.checked)} className="mt-1 w-5 h-5 rounded text-green-600 focus:ring-green-600" />
              <div>
                <p className="font-medium text-gray-900">Comentarios en documentos</p>
                <p className="text-sm text-gray-500">Recibe un correo cuando el equipo responda o comente en un entregable.</p>
              </div>
            </label>
            <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input type="checkbox" checked={weekly} onChange={e => setWeekly(e.target.checked)} className="mt-1 w-5 h-5 rounded text-green-600 focus:ring-green-600" />
              <div>
                <p className="font-medium text-gray-900">Resumen semanal</p>
                <p className="text-sm text-gray-500">Recibe un reporte automático cada viernes con el progreso de tus proyectos.</p>
              </div>
            </label>
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
            {saving ? "Guardando..." : "Guardar preferencias"}
          </button>
        </div>
      </div>
    </div>
  );
}
