import Link from "next/link";

interface FinanceTabsProps {
  activeTab: "movimientos" | "invoices" | "projects" | "cashflow";
}

export function FinanceTabs({ activeTab }: FinanceTabsProps) {
  const tabs = [
    { id: "movimientos", label: "Movimientos", href: "/os/finances" },
    { id: "invoices", label: "Cuentas de Cobro", href: "/os/finances/invoices" },
    { id: "projects", label: "P&L Proyectos", href: "/os/finances/projects" },
    { id: "cashflow", label: "Flujo de Caja", href: "/os/finances/cashflow" },
  ];

  return (
    <div className="border-b border-[var(--color-border)] mb-6">
      <div className="flex gap-6">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 -mb-[2px] ${
                isActive
                  ? "border-[var(--color-primary)] text-[var(--color-foreground)]"
                  : "border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
