"use client";
import { useState, useCallback } from "react";
import { SavedViewBar } from "./SavedViewBar";
import { toast } from "sonner";
import { createSavedViewAction, listSavedViewsAction, deleteSavedViewAction, updateSavedViewAction } from "@/lib/db/actions/saved-views";

interface SavedView {
  id: string;
  name: string;
  route: string;
  queryJson: any;
  isShared: boolean;
}

export function SavedViewBarWrapper({ route, initialViews = [], initialViewId }: { route: string; initialViews?: SavedView[]; initialViewId?: string | null }) {
  const [views, setViews] = useState<SavedView[]>(initialViews);
  const [currentViewId, setCurrentViewId] = useState<string | null>(initialViewId || null);

  const refreshViews = useCallback(async () => {
    const fresh = await listSavedViewsAction(route) as unknown as SavedView[];
    setViews(fresh);
  }, [route]);

  const handleSelectView = useCallback((viewId: string) => {
    setCurrentViewId(viewId);
    if (viewId === 'default') {
      window.location.href = route;
    } else {
      const view = views.find(v => v.id === viewId);
      if (view) {
        window.location.href = `${route}?view=${viewId}`;
      }
    }
  }, [route, views]);

  const handleSaveView = useCallback(async () => {
    const name = prompt("Nombre para la vista:");
    if (!name) return;
    try {
      await createSavedViewAction(name, route, {});
      toast.success(`Vista "${name}" guardada`);
      await refreshViews();
    } catch {
      toast.error("Error al guardar la vista");
    }
  }, [route, refreshViews]);

  const handleUpdateView = useCallback(async (viewId: string) => {
    const name = prompt("Nuevo nombre:");
    if (!name) return;
    try {
      await updateSavedViewAction(viewId, { name });
      toast.success("Vista actualizada");
      await refreshViews();
    } catch {
      toast.error("Error al actualizar");
    }
  }, [refreshViews]);

  const handleDeleteView = useCallback(async (viewId: string) => {
    try {
      await deleteSavedViewAction(viewId);
      toast.success("Vista eliminada");
      await refreshViews();
      if (currentViewId === viewId) setCurrentViewId(null);
    } catch {
      toast.error("Error al eliminar");
    }
  }, [refreshViews, currentViewId]);

  return (
    <SavedViewBar
      route={route}
      views={views}
      currentViewId={currentViewId}
      onSelectView={handleSelectView}
      onSaveView={handleSaveView}
      onUpdateView={handleUpdateView}
      onDeleteView={handleDeleteView}
    />
  );
}
