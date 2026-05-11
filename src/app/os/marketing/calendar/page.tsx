import Link from "next/link";
import { db } from "@/lib/db";
import { contentPlan } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { requireOsUser } from "@/lib/auth/session";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from "date-fns";
import { es } from "date-fns/locale";

export default async function MarketingCalendarPage() {
  await requireOsUser();
  const allContent = await db.select().from(contentPlan).orderBy(desc(contentPlan.scheduledAt));

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div>
      <PageHeader
        title={`Calendario - ${format(now, "MMMM yyyy", { locale: es })}`}
        description="Publicaciones planificadas del mes."
        breadcrumbs={[{ label: "Marketing", href: "/os/marketing" }, { label: "Calendario" }]}
        primaryAction={
          <Link
            href="/os/marketing"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            Crear contenido
          </Link>
        }
      />
      <div className="mt-6 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {dayNames.map(d => (
            <div key={d} className="px-3 py-2 text-xs font-semibold text-[var(--color-muted-foreground)] uppercase text-center border-r last:border-r-0 border-[var(--color-border)]">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-[var(--color-border)] bg-[var(--color-muted)]/10" />
          ))}
          {days.map(day => {
            const dayContent = allContent.filter(c => c.scheduledAt && isSameDay(new Date(c.scheduledAt), day));
            return (
              <div key={day.toISOString()} className="min-h-[100px] border-b border-r border-[var(--color-border)] p-1.5">
                <span className={`text-xs font-medium ${isSameDay(day, now) ? 'bg-[var(--color-primary)] text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-[var(--color-muted-foreground)]'}`}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-0.5">
                  {dayContent.map(c => (
                    <div key={c.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${c.status === 'publicado' ? 'bg-green-500/10 text-green-600' : c.status === 'en_produccion' ? 'bg-blue-500/10 text-blue-600' : 'bg-gray-500/10 text-gray-600'}`}>
                      {c.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
