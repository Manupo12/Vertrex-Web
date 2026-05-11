import { db } from "@/lib/db";
import { projects, finances, entityLinks } from "@/lib/db/schema";
import { eq, or, and } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { ProjectsFinanceView } from "./ProjectsFinanceView";

export default async function FinancesProjectsPage() {
  await requireOsUser();
  const activeProjects = await db.select().from(projects).where(eq(projects.status, "active"));
  const allFinances = await db.select().from(finances);
  const allLinks = await db.select().from(entityLinks).where(or(eq(entityLinks.sourceType, "finance"), eq(entityLinks.targetType, "finance")));

  // Calculate P&L for each active project
  const projectStats = activeProjects.map(project => {
    // Find finances linked to this project
    const financeIds = allLinks
      .filter(l => 
        (l.sourceId === project.id && l.sourceType === "project" && l.targetType === "finance") ||
        (l.targetId === project.id && l.targetType === "project" && l.sourceType === "finance")
      )
      .map(l => l.sourceType === "finance" ? l.sourceId : l.targetId);

    const projectFinances = allFinances.filter(f => financeIds.includes(f.id));
    
    let ingresos = 0;
    let gastos = 0;

    projectFinances.forEach(f => {
      // In V3 we assume all amounts are in COP for simplicity of aggregation, 
      // or we handle conversion. Here we do a simple sum.
      if (f.status === "paid") {
        if (f.type === "ingreso") ingresos += f.amountCop;
        else if (f.type === "gasto") gastos += f.amountCop;
      }
    });

    const margen = ingresos - gastos;
    const margenPorcentaje = ingresos > 0 ? (margen / ingresos) * 100 : 0;

    return {
      ...project,
      ingresos,
      gastos,
      margen,
      margenPorcentaje
    };
  });

  return (
    <div>
      <PageHeader 
        title="P&L por Proyecto" 
        description="Estado financiero y margen de los proyectos activos." 
        breadcrumbs={[{ label: "Finanzas", href: "/os/finances" }, { label: "P&L Proyectos" }]}
      />
      <ProjectsFinanceView projects={projectStats} />
    </div>
  );
}
