"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { updateTeamMemberRoleAction, deactivateTeamMemberAction } from "@/lib/db/actions/team";
import { toast } from "sonner";

export function ManageMember({ userId, currentRole, isActive }: { userId: string; currentRole: string; isActive: boolean }) {
  const [deactivating, setDeactivating] = useState(false);

  const handleRoleChange = async (role: "team" | "admin") => {
    try { await updateTeamMemberRoleAction(userId, role); toast.success("Rol actualizado"); } catch { toast.error("Error"); }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try { await deactivateTeamMemberAction(userId); toast.success("Usuario desactivado"); } catch { toast.error("Error"); }
    setDeactivating(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleRoleChange(currentRole === "admin" ? "team" : "admin")}>
          Cambiar a {currentRole === "admin" ? "team" : "admin"}
        </Button>
        {isActive && (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="danger" size="sm">Desactivar</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Desactivar usuario</AlertDialogTitle><AlertDialogDescription>El usuario perdera acceso al sistema. Esta accion se puede revertir manualmente.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground">Desactivar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
