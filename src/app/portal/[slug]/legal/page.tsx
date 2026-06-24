import { db } from "@/lib/db";
import { legalDocuments, clients, signatures, entityLinks } from "@/lib/db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { LegalView } from "./LegalView";

export default async function PortalLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId));
  if (!client) throw new Error("Cliente no encontrado");

  const connections = await db.select()
    .from(entityLinks)
    .where(
      and(
        or(eq(entityLinks.sourceId, client.id), eq(entityLinks.targetId, client.id)),
        or(eq(entityLinks.sourceType, "legal"), eq(entityLinks.targetType, "legal"))
      )
    );

  const legalIds = connections.map(l => l.sourceId === client.id ? l.targetId : l.sourceId);

  const publicLegals = legalIds.length > 0
    ? await db.select()
        .from(legalDocuments)
        .where(and(eq(legalDocuments.isPublic, true), inArray(legalDocuments.id, legalIds)))
        .orderBy(desc(legalDocuments.createdAt))
    : [];
  
  let clientSignatures: any[] = [];
  if (legalIds.length > 0) {
    clientSignatures = await db.select()
      .from(signatures)
      .where(eq(signatures.clientId, client.id));
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Documentos Legales</h1>
        <p className="text-muted-foreground text-lg">Revisa y firma tus contratos y acuerdos.</p>
      </div>
      
      <LegalView 
        initialDocuments={publicLegals} 
        clientSignatures={clientSignatures}
        clientId={client.id}
      />
    </div>
  );
}
