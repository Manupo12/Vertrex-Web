"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResourceAction } from "@/lib/db/actions/resources";
import { toast } from "sonner";

export function CreateResourceForm() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const resource = await createResourceAction(formData);
      toast.success("Recurso creado");
      router.push(`/os/resources/${resource.id}`);
    } catch (err: any) {
      toast.error(err.message || "Error al crear recurso");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Título *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            placeholder="Ej. API Key de OpenAI"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Tipo
          </label>
          <select
            id="type"
            name="type"
            defaultValue="api_key"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="api_key">API Key</option>
            <option value="env">.env</option>
            <option value="password">Contraseña</option>
            <option value="credential">Credencial</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label htmlFor="value" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Valor (será cifrado) *
          </label>
          <textarea
            id="value"
            name="value"
            required
            rows={4}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] font-mono"
            placeholder="sk-... o el valor confidencial"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Cifrando y guardando..." : "Guardar recurso"}
        </button>
      </form>
    </div>
  );
}
