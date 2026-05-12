"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamMemberAction } from "@/lib/db/actions/team";
import { toast } from "sonner";

export function CreateTeamMemberForm() {
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const result = await createTeamMemberAction(formData);
      toast.success(`Miembro creado: ${result.email}`);
      router.push("/os/team");
    } catch (err: any) {
      toast.error(err.message || "Error al crear miembro");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Nombre *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            placeholder="Ej. Daniel Quintero"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Correo electrónico *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            placeholder="daniel@vertrex.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Contraseña temporal *
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-[var(--color-muted-foreground)] mb-1">
            Rol *
          </label>
          <select
            id="role"
            name="role"
            defaultValue="team"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          >
            <option value="team">Miembro del equipo</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creando..." : "Crear miembro"}
        </button>
      </form>
    </div>
  );
}
