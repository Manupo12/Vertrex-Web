"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revealResourceAction } from "@/lib/db/actions/resources";
import { toast } from "sonner";
import { Eye, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

export function RevealButton({ resourceId }: { resourceId: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleReveal = async () => {
    try {
      const r = await revealResourceAction(resourceId);
      setValue(r.value);
    } catch {
      toast.error("Error al revelar");
    }
  };

  let parsedCredential: { email?: string; password?: string } | null = null;
  if (value) {
    try {
      if (value.startsWith("{") && value.endsWith("}")) {
        const parsed = JSON.parse(value);
        if (parsed && (parsed.email !== undefined || parsed.password !== undefined)) {
          parsedCredential = parsed;
        }
      }
    } catch (e) {
      // not a JSON credential, keep parsedCredential null
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setTimeout(() => setValue(null), 300);
    }}>
      <SheetTrigger asChild>
        <Button onClick={handleReveal} variant="outline">
          <Eye className="mr-2 h-4 w-4" />
          Revelar valor
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Valor secreto</SheetTitle>
          <SheetDescription>Este valor confidencial solo debe compartirse por canales seguros.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {value ? (
            parsedCredential ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-accent/20 p-4 space-y-3">
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Correo / Usuario
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-background/50 rounded p-2 text-sm border border-border">
                      <span className="font-mono truncate select-all">{parsedCredential.email || "-"}</span>
                      {parsedCredential.email && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(parsedCredential!.email || "");
                            toast.success("Correo/usuario copiado");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Contraseña
                    </span>
                    <div className="flex items-center justify-between gap-2 bg-background/50 rounded p-2 text-sm border border-border">
                      <span className="font-mono truncate select-all">{parsedCredential.password || "-"}</span>
                      {parsedCredential.password && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 shrink-0"
                          onClick={() => {
                            navigator.clipboard.writeText(parsedCredential!.password || "");
                            toast.success("Contraseña copiada");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
            )
          ) : (
            <p className="text-sm text-muted-foreground">Revelando...</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
