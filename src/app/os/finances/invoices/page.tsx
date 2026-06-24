import { db } from "@/lib/db";
import { legalDocuments, clients, projects } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { InvoicesView } from "./InvoicesView";
import { GenerateInvoiceButton } from "./GenerateInvoiceButton";
import { FinanceTabs } from "../FinanceTabs";

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
          <GenerateInvoiceButton projects={allProjects} />
        }
      />
      
      <FinanceTabs activeTab="invoices" />
      
      <InvoicesView initialInvoices={invoices} clients={allClients} projects={allProjects} />
    </div>
  );
}
