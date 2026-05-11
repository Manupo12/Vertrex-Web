"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TicketForm({ clientId }: { clientId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { toast.error("Completa todos los campos"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/tickets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, title, description }) });
      if (!res.ok) throw new Error("Error");
      toast.success("Ticket enviado correctamente");
      setTitle(""); setDescription("");
      router.refresh();
    } catch { toast.error("Error al enviar ticket"); }
    setSending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="block text-base font-medium text-gray-700 mb-1">Asunto</label><input value={title} onChange={e => setTitle(e.target.value)} required className="w-full rounded-xl border border-gray-300 p-3 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Que necesitas?" /></div>
      <div><label className="block text-base font-medium text-gray-700 mb-1">Descripcion</label><textarea value={description} onChange={e => setDescription(e.target.value)} required rows={4} className="w-full rounded-xl border border-gray-300 p-3 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe tu solicitud..." /></div>
      <Button type="submit" size="lg" disabled={sending} className="w-full text-lg py-3">{sending ? "Enviando..." : "Enviar ticket"}</Button>
    </form>
  );
}
