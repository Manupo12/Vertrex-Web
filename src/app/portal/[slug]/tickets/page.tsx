import { db } from "@/lib/db";
import { tickets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requirePortalClient } from "@/lib/auth/portal";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Inbox } from "lucide-react";
import { formatShortDate } from "@/lib/format";
import { TicketForm } from "./TicketForm";

interface Props { params: Promise<{ slug: string }> }

const STATUS_LABELS: Record<string, string> = { open: "Recibido", in_progress: "En proceso", resolved: "Resuelto" };
const STATUS_COLORS: Record<string, string> = { open: "warning", in_progress: "info", resolved: "success" };

export default async function PortalTickets({ params }: Props) {
  const { slug } = await params;
  const session = await requirePortalClient(slug);
  const clientTickets = await db.select().from(tickets).where(eq(tickets.clientId, session.clientId)).orderBy(tickets.createdAt);

  return (
    <div className="space-y-6">
      <div><Link href={`/portal/${slug}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-lg"><ArrowLeft className="h-5 w-5" />Volver</Link><h1 className="text-2xl font-bold mt-2 text-gray-900">Soporte</h1></div>

      <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-900"><MessageSquare className="h-5 w-5" />Enviar ticket</h2>
        <TicketForm clientId={session.clientId} />
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Historial ({clientTickets.length})</h2>
        {clientTickets.map(t => (
          <div key={t.id} className="rounded-xl border border-gray-200 p-5 bg-white shadow-sm">
            <div className="flex items-start sm:items-center justify-between mb-3 flex-col sm:flex-row gap-2">
              <p className="font-semibold text-lg text-gray-900">{t.title}</p>
              <Badge variant={STATUS_COLORS[t.status] as "warning" | "info" | "success"} className="text-sm px-3 py-1 font-medium">{STATUS_LABELS[t.status] || t.status}</Badge>
            </div>
            <p className="text-gray-600 text-base">{t.description}</p>
            <p className="text-gray-400 text-sm mt-3 pt-3 border-t border-gray-100 font-medium">Recibido el {formatShortDate(t.createdAt)}</p>
          </div>
        ))}
        {clientTickets.length === 0 && (
          <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center">
            <Inbox className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-gray-500 text-lg">No has enviado tickets aun.</p>
          </div>
        )}
      </div>
    </div>
  );
}
