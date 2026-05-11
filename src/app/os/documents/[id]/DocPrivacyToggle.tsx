"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateDocumentPrivacyAction } from "@/lib/db/actions/documents";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export function DocPrivacyToggle({ docId, initialIsPublic }: { docId: string, initialIsPublic: boolean }) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    try {
      await updateDocumentPrivacyAction(docId, !isPublic);
      setIsPublic(!isPublic);
      toast.success(isPublic ? "Documento ocultado del portal" : "Documento visible en el portal");
    } catch {
      toast.error("Error al actualizar privacidad");
    }
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Exponer en portal</span>
        {isPublic ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
      </div>
      <Button 
        variant={isPublic ? "outline" : "primary"} 
        size="sm" 
        onClick={handleToggle} 
        disabled={saving}
        className="h-8"
      >
        {isPublic ? "Ocultar" : "Exponer"}
      </Button>
    </div>
  );
}
