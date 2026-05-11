"use client";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyButton({ text }: { text: string }) {
  return (
    <Button variant="outline" size="icon" onClick={() => {
      navigator.clipboard.writeText(text);
      toast.success("Contrasena copiada");
    }}>
      <Copy className="h-4 w-4" />
    </Button>
  );
}