"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revealSocialPasswordAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";
import { Eye, Copy, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

export function SocialRevealButton({ accountId }: { accountId: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReveal = async () => {
    setRevealing(true);
    setError(null);
    try {
      const r = await revealSocialPasswordAction(accountId);
      setValue(r.password);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "No se pudo revelar la contrasena";
      setError(message);
      toast.error(message);
    } finally {
      setRevealing(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setValue(null);
        setError(null);
      }, 300);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button onClick={handleReveal} variant="outline" disabled={revealing}>
          <Eye className="mr-2 h-4 w-4" />
          {revealing ? "Revelando..." : "Revelar contrasena"}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Contrasena de cuenta</SheetTitle>
          <SheetDescription>No compartas esta contrasena publicamente.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {value ? (
            <>
              <code className="block w-full break-all rounded-lg bg-accent p-4 text-sm text-foreground">
                {value}
              </code>
              <Button
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(value);
                  toast.success("Copiado al portapapeles");
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
            </>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Revelando...</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}