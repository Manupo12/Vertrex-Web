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
          ) : (
            <p className="text-sm text-muted-foreground">Revelando...</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
