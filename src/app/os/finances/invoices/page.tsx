import { db } from "@/lib/db";
import { legalDocuments, clients, projects } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { InvoicesView } from "./InvoicesView";

export default async function InvoicesPage() {
  await requireOsUser();
  const invoices = await db.select().from(legalDocuments).where(eq(legalDocuments.type, "cuenta_cobro")).orderBy(desc(legalDocuments.createdAt));
  const allClients = await db.select().from(clients);
  const allProjects = await db.select().from(projects);

  return (
    <div>
      <PageHeader 
        title="Cuentas de Cobro" 
        description="Facturación y cuentas generadas." 
        breadcrumbs={[{ label: "Finanzas", href: "/os/finances" }, { label: "Cuentas de cobro" }]}
        primaryAction={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            + Generar cuenta
          </button>
        }
      />
      
      <InvoicesView initialInvoices={invoices} clients={allClients} projects={allProjects} />
    </div>
  );
}
