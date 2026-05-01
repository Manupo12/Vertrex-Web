import { buildJsonErrorResponse } from "@/lib/api/error-response";
import { requireTeamSession } from "@/lib/auth/session";
import { getDb, isDatabaseConfigured, schema } from "@/lib/db";
import { buildCsvContent, buildCsvResponse, type CsvColumn } from "@/lib/export/csv-export";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireTeamSession();

    if (!isDatabaseConfigured) {
      return Response.json({ error: "Base de datos no configurada." }, { status: 503 });
    }

    const db = getDb();
    const transactions = await db.select().from(schema.transactions).orderBy(schema.transactions.occurredAt);

    const columns: CsvColumn<(typeof transactions)[number]>[] = [
      { header: "ID", accessor: (row) => row.id },
      { header: "Cliente ID", accessor: (row) => row.clientId },
      { header: "Proyecto ID", accessor: (row) => row.projectId },
      { header: "Concepto", accessor: (row) => row.description },
      { header: "Categoría", accessor: (row) => row.category },
      { header: "Tipo", accessor: (row) => row.type },
      { header: "Monto (cents)", accessor: (row) => row.amountCents },
      { header: "Fecha", accessor: (row) => row.occurredAt?.toISOString() ?? "" },
      { header: "Creado", accessor: (row) => row.createdAt?.toISOString() ?? "" },
    ];

    const csv = buildCsvContent(columns, transactions);
    return buildCsvResponse(csv, `vertrex-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    return buildJsonErrorResponse(error, "No fue posible exportar transacciones.");
  }
}
