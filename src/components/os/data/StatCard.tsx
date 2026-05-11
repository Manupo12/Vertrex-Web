"use client";
import { Users, FolderKanban, MessageSquare, Database, DollarSign, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  projects: FolderKanban,
  tickets: MessageSquare,
  database: Database,
  dollar: DollarSign,
  ingresos: TrendingUp,
  gastos: TrendingDown,
  pending: AlertCircle,
};

interface StatCardProps {
  iconName: string;
  label: string;
  value: string | number;
  delta?: string;
  href?: string;
  className?: string;
}

export function StatCard({ iconName, label, value, delta, href, className }: StatCardProps) {
  const Icon = ICONS[iconName] || Database;
  const content = (
    <div className={cn("rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/30", href && "cursor-pointer", className)}>
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {delta && <span className="text-xs font-medium text-primary">{delta}</span>}
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
