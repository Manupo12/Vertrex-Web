"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Copy, Key } from "lucide-react";

export function PinManager({ slug, generatePin, initialPin }: { slug: string; generatePin: (slug: string) => Promise<{ pin: string }>; initialPin?: string }) {
  const [pin, setPin] = useState(initialPin || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePin(slug);
      setPin(result.pin);
      setOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
    setLoading(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
        <Key className="mr-2 h-4 w-4" />{loading ? "Generando..." : "Generar PIN"}
      </Button>
      {pin && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>PIN de acceso generado</AlertDialogTitle>
              <AlertDialogDescription>Este PIN solo se muestra una vez. Copialo y envialo al cliente por WhatsApp.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center justify-center gap-3 py-4">
              <code className="rounded-lg bg-accent px-6 py-3 text-3xl font-bold tracking-widest text-primary">{pin}</code>
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(pin); toast.success("PIN copiado"); }}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">Envia este PIN junto con el link del portal al cliente.</p>
            <AlertDialogFooter>
              <AlertDialogCancel>Cerrar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { navigator.clipboard.writeText(pin); toast.success("PIN copiado para WhatsApp"); }}>Copiar para WhatsApp</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
