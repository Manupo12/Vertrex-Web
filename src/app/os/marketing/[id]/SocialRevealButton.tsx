"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revealSocialPasswordAction } from "@/lib/db/actions/marketing";
import { toast } from "sonner";
import { Eye, Copy } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";

export function SocialRevealButton({ accountId }: { accountId: string }) {
  const [value, setValue] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const handleReveal = async () => {
    setRevealing(true);
    try {
      const r = await revealSocialPasswordAction(accountId);
      setValue(r.password);
    } catch {
      toast.error("Error al revelar");
    }
    setRevealing(false);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) setTimeout(() => setValue(null), 300);
    }}>
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
          ) : (
            <p className="text-sm text-muted-foreground">Revelando...</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}