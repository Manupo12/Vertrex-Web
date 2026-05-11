import { db } from "@/lib/db";
import { legalDocuments, signatures, clients, clientPortalUsers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { formatShortDate } from "@/lib/format";

export default async function LegalSignaturesPage({ params }: { params: Promise<{ id: string }> }) {
  await requireOsUser();
  const { id } = await params;

  const [legal] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, id));
  if (!legal) throw new Error("Documento legal no encontrado");

  const allSignatures = await db.select().from(signatures).where(eq(signatures.legalId, id)).orderBy(desc(signatures.signedAt));
  const allClients = await db.select().from(clients);
  const allPortalUsers = await db.select().from(clientPortalUsers);

  return (
    <div>
      <PageHeader
        title={`Firmas - ${legal.name}`}
        description={`${allSignatures.length} firma(s) registrada(s)`}
        breadcrumbs={[
          { label: "Legal", href: "/os/legal" },
          { label: legal.name, href: `/os/legal/${id}` },
          { label: "Firmas" }
        ]}
      />

      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        {allSignatures.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/30">
                <th className="text-left px-4 py-3 font-medium">Firmante</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 font-medium">IP</th>
                <th className="text-left px-4 py-3 font-medium">User Agent</th>
                <th className="text-right px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {allSignatures.map(s => (
                <tr key={s.id} className="hover:bg-[var(--color-muted)]/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.signerName}</td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)]">{s.signerEmail || "-"}</td>
                  <td className="px-4 py-3">{allClients.find(c => c.id === s.clientId)?.name || "-"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[var(--color-muted-foreground)]">{s.ipAddress || "-"}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted-foreground)] truncate max-w-[200px]" title={s.userAgent || ""}>{s.userAgent ? s.userAgent.slice(0, 60) + "..." : "-"}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{formatShortDate(s.signedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center">
            <div className="text-4xl mb-4 opacity-20">✍️</div>
            <p className="text-[var(--color-muted-foreground)] font-medium">Sin firmas registradas</p>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">Cuando el cliente firme este documento desde el portal, aparecerá aquí.</p>
          </div>
        )}
      </div>

      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-4">Información del documento</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[var(--color-muted-foreground)]">Tipo</span>
            <p className="font-medium capitalize">{legal.type}</p>
          </div>
          <div>
            <span className="text-[var(--color-muted-foreground)]">Requiere firma</span>
            <p className="font-medium">{legal.requiresSignature ? "Sí" : "No"}</p>
          </div>
          <div>
            <span className="text-[var(--color-muted-foreground)]">Firmado</span>
            <p className="font-medium">{legal.signedAt ? formatShortDate(legal.signedAt) : "Pendiente"}</p>
          </div>
          <div>
            <span className="text-[var(--color-muted-foreground)]">Expira</span>
            <p className="font-medium">{legal.expiresAt ? formatShortDate(legal.expiresAt) : "Sin fecha"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
