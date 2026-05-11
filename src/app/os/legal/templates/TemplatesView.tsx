"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ScaleIcon, FileTextIcon, SettingsIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TemplatesView({ initialTemplates }: { initialTemplates: any[] }) {
  const [templates] = useState(initialTemplates);

  if (templates.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState 
          icon={ScaleIcon} 
          title="Sin plantillas" 
          description="Crea tu primera plantilla legal para reutilizar en contratos o acuerdos." 
        />
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((tpl) => (
        <div key={tpl.id} className="bg-[var(--color-card)] rounded-xl border border-[var(--color-border)] p-6 flex flex-col h-full hover:border-[var(--color-primary)]/50 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                <FileTextIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg line-clamp-1" title={tpl.name}>{tpl.name}</h3>
                <span className="text-xs text-[var(--color-muted-foreground)] capitalize">{tpl.type.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6 flex-1">
            <div className="text-sm text-[var(--color-muted-foreground)] mb-2">Variables requeridas:</div>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(tpl.variables) && tpl.variables.length > 0 ? (
                tpl.variables.map((v: any, i: number) => (
                  <span key={i} className="text-xs bg-[var(--color-muted)] text-[var(--color-muted-foreground)] px-2 py-1 rounded-md font-mono">
                    {`{{${v.key}}}`}
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-[var(--color-muted-foreground)]">Sin variables</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--color-border)] mt-auto">
            <Button variant="outline" size="sm" className="h-8">
              <SettingsIcon className="h-4 w-4 mr-2" /> Editar
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[var(--color-destructive)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
