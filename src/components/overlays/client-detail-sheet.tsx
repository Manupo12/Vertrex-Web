"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, FileText, FolderKanban, MessageSquare, Pencil, Plus, Save, Trash2, User, X } from "lucide-react";
import type { WorkspaceSnapshot } from "@/lib/ops/workspace-service";
import { updateClient, archiveClient } from "@/lib/crm/crm-service";
import { getComments, addComment } from "@/lib/comments/comment-service";
import type { CommentRecord } from "@/lib/comments/comment-service";
import { getContactsByClient, createContact, deleteContact } from "@/lib/crm/client-contact-service";
import type { ClientContactRole } from "@/lib/crm/client-contact-service";

function SectionTitle({ icon: Icon, title }: { icon: typeof FileText; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {title}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function ClientDetailSheet({
  open,
  id,
  snapshot,
  onOpenChange,
}: {
  open: boolean;
  id: string | null;
  snapshot: WorkspaceSnapshot;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const client = snapshot?.clients.find((item) => item.id === id || item.slug === id);
  const projects = snapshot?.projects.filter((project) => project.clientId === client?.id).map((project) => project.name) ?? [];

  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [contacts, setContacts] = useState<{ id: string; name: string; email: string | null; phone: string | null; role: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newContact, setNewContact] = useState({ name: "", email: "", phone: "", role: "primary" });
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", company: "", phase: "" });

  useEffect(() => {
    if (!client?.id) return;
    getComments("client", client.id).then(setComments);
    getContactsByClient(client.id).then((rows) =>
      setContacts(
        rows.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role }))
      )
    );
    setEditForm({
      name: client.name,
      email: client.email ?? "",
      phone: "",
      company: client.company ?? "",
      phase: client.phase ?? "",
    });
  }, [client?.id]);

  if (!open || !client) return null;

  const handleSave = () => {
    startTransition(async () => {
      await updateClient(client.id, {
        name: editForm.name,
        email: editForm.email || null,
        company: editForm.company || null,
        phase: editForm.phase || null,
      });
      setIsEditing(false);
      router.refresh();
    });
  };

  const handleArchive = () => {
    if (!confirm("¿Archivar este cliente?")) return;
    startTransition(async () => {
      await archiveClient(client.id);
      onOpenChange(false);
      router.refresh();
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    startTransition(async () => {
      await addComment("client", client.id, "Equipo", newComment);
      setNewComment("");
      const updated = await getComments("client", client.id);
      setComments(updated);
    });
  };

  const handleAddContact = () => {
    if (!newContact.name.trim()) return;
    startTransition(async () => {
      await createContact(client.id, {
        name: newContact.name,
        email: newContact.email || null,
        phone: newContact.phone || null,
        role: newContact.role as ClientContactRole,
      });
      setNewContact({ name: "", email: "", phone: "", role: "primary" });
      const updated = await getContactsByClient(client.id);
      setContacts(
        updated.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role }))
      );
    });
  };

  const handleDeleteContact = (contactId: string) => {
    startTransition(async () => {
      await deleteContact(contactId);
      const updated = await getContactsByClient(client.id);
      setContacts(
        updated.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, role: r.role }))
      );
    });
  };

  return (
    <div className="fixed inset-0 z-[140]">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="absolute inset-y-0 right-0 z-[141] flex w-full max-w-2xl flex-col border-l border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{client.company ?? client.phase ?? client.status} · Health {client.progress}/100</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-secondary/50 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                {isEditing ? "Cancelar" : "Editar"}
              </button>
              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Guardando..." : "Guardar"}
                </button>
              )}
            </div>
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Archivar
            </button>
          </div>

          {isEditing ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Empresa</label>
                <input
                  value={editForm.company}
                  onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Fase</label>
                <input
                  value={editForm.phase}
                  onChange={(e) => setEditForm((f) => ({ ...f, phase: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <MetricRow label="Owner" value={client.brand || "Vertrex"} />
              <MetricRow label="Email" value={client.email ?? "Sin email"} />
              <MetricRow label="Segmento" value={client.company ?? client.phase ?? client.status} />
              <MetricRow label="Progreso" value={`${client.progress}%`} />
            </div>
          )}

          <div>
            <SectionTitle icon={FolderKanban} title="Proyectos vinculados" />
            <div className="space-y-2">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div key={project} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
                    <span className="text-foreground">{project}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Sin proyectos vinculados.</p>
              )}
            </div>
          </div>

          <div>
            <SectionTitle icon={User} title="Contactos" />
            <div className="space-y-2">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{c.name}</span>
                    {c.email && <span className="ml-2 text-muted-foreground">{c.email}</span>}
                    <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">{c.role}</span>
                  </div>
                  <button onClick={() => handleDeleteContact(c.id)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto] items-end">
              <input
                placeholder="Nombre"
                value={newContact.name}
                onChange={(e) => setNewContact((c) => ({ ...c, name: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <input
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact((c) => ({ ...c, email: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <input
                placeholder="Teléfono"
                value={newContact.phone}
                onChange={(e) => setNewContact((c) => ({ ...c, phone: e.target.value }))}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleAddContact}
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Añadir
              </button>
            </div>
          </div>

          <div>
            <SectionTitle icon={MessageSquare} title="Comentarios" />
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{c.author}</span>
                    <span className="text-[11px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("es-CO")}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{c.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Añadir comentario..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleAddComment}
                disabled={isPending || !newComment.trim()}
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
