import { db } from "@/lib/db";
import { legalDocuments, clients, signatures } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { LegalView } from "./LegalView";

export default async function PortalLegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);

  const [client] = await db.select().from(clients).where(eq(clients.id, session.clientId));
  if (!client) throw new Error("Cliente no encontrado");

  // In a real app we'd filter by entityLinks pointing to this client
  // For V3 spec simplicity, we fetch all public legal documents.
  const publicLegals = await db.select()
    .from(legalDocuments)
    .where(eq(legalDocuments.isPublic, true))
    .orderBy(desc(legalDocuments.createdAt));

  const legalIds = publicLegals.map(l => l.id);
  
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
