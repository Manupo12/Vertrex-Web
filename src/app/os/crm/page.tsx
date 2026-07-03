import { db } from "@/lib/db";
import { clients, clientContactors, users } from "@/lib/db/schema";
import { eq, sql, ilike, and, or, count } from "drizzle-orm";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { CrmList } from "./CrmList";
import { NewClientDialog } from "./NewClientDialog";

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    sector?: string;
    city?: string;
    country?: string;
    rating?: string;
    webPresence?: string;
    page?: string;
  }>;
}

export default async function CrmPage({ searchParams }: Props) {
  const {
    q = "",
    status = "",
    priority = "",
    sector = "",
    city = "",
    country = "",
    rating = "",
    webPresence = "",
    page = "1",
  } = await searchParams;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  // Build WHERE conditions
  const conditions = [];

  if (status && status !== "all") {
    conditions.push(eq(clients.status, status));
  }

  if (priority && priority !== "all") {
    if (priority === "alta") conditions.push(ilike(clients.priority, "%Alta%"));
    else if (priority === "media") conditions.push(ilike(clients.priority, "%Media%"));
    else if (priority === "baja") conditions.push(ilike(clients.priority, "%Baja%"));
    else if (priority === "none") conditions.push(sql`${clients.priority} IS NULL`);
  }

  if (sector && sector !== "all") {
    conditions.push(eq(clients.sector, sector));
  }

  if (city && city !== "all") {
    conditions.push(eq(clients.city, city));
  }

  if (country && country !== "all") {
    conditions.push(eq(clients.country, country));
  }

  if (webPresence && webPresence !== "all") {
    if (webPresence === "SIN WEB") {
      conditions.push(eq(clients.webPresence, "SIN WEB"));
    } else if (webPresence === "con_web") {
      conditions.push(
        and(
          sql`${clients.webPresence} IS NOT NULL`,
          sql`${clients.webPresence} <> 'SIN WEB'`
        )
      );
    } else {
      conditions.push(eq(clients.webPresence, webPresence));
    }
  }

  if (rating && rating !== "all") {
    if (rating === "4.5") conditions.push(sql`CAST(${clients.rating} AS FLOAT) >= 4.5`);
    else if (rating === "4.0") conditions.push(sql`CAST(${clients.rating} AS FLOAT) >= 4.0`);
    else if (rating === "low") conditions.push(sql`CAST(${clients.rating} AS FLOAT) < 4.0 AND ${clients.rating} IS NOT NULL`);
    else if (rating === "none") conditions.push(sql`${clients.rating} IS NULL`);
  }

  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(clients.name, like),
        ilike(clients.city, like),
        ilike(clients.sector, like),
        ilike(clients.phone, like),
        ilike(clients.address, like),
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Parallel queries
  const [
    totalResult,
    allClients,
    statsRows,
    webPresenceStats,
    distinctSectors,
    distinctCities,
    distinctCountries,
    contactorsList,
  ] = await Promise.all([
    // Total count for pagination
    db.select({ count: count() }).from(clients).where(whereClause),

    // Paginated clients
    db.select().from(clients).where(whereClause)
      .orderBy(sql`
        CASE priority
          WHEN '🔥 Alta' THEN 1
          WHEN 'Media' THEN 2
          WHEN 'Baja' THEN 3
          ELSE 4
        END,
        created_at DESC
      `)
      .limit(PAGE_SIZE)
      .offset(offset),

    // Status stats (always global)
    db.select({ status: clients.status, count: sql<number>`count(*)::int` })
      .from(clients).groupBy(clients.status),

    // Web presence stats (global)
    db.select({ webPresence: clients.webPresence, count: sql<number>`count(*)::int` })
      .from(clients).groupBy(clients.webPresence),

    // Distinct sectors for filter dropdown
    db.selectDistinct({ sector: clients.sector }).from(clients)
      .where(sql`${clients.sector} IS NOT NULL`)
      .orderBy(clients.sector),

    // Distinct cities
    db.selectDistinct({ city: clients.city }).from(clients)
      .where(sql`${clients.city} IS NOT NULL`)
      .orderBy(clients.city),

    // Distinct countries
    db.selectDistinct({ country: clients.country }).from(clients)
      .where(sql`${clients.country} IS NOT NULL`)
      .orderBy(clients.country),

    // Contactors
    db.select({
      clientId: clientContactors.clientId,
      userId: users.id,
      userName: users.name,
    }).from(clientContactors).innerJoin(users, eq(clientContactors.userId, users.id)),
  ]);

  const totalCount = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const stats = statsRows.reduce(
    (acc, row) => ({ ...acc, [row.status]: row.count }),
    {} as Record<string, number>
  );

  const webPresenceMap = webPresenceStats.reduce(
    (acc, row) => ({ ...acc, [row.webPresence ?? "null"]: row.count }),
    {} as Record<string, number>
  );

  const contactorsMap = contactorsList.reduce((acc, row) => {
    if (!acc[row.clientId]) acc[row.clientId] = [];
    acc[row.clientId].push({ id: row.userId, name: row.userName });
    return acc;
  }, {} as Record<string, { id: string; name: string }[]>);

  const clientsWithContactors = allClients.map((c) => ({
    ...c,
    contactors: contactorsMap[c.id] || [],
  }));

  const sectors = distinctSectors.map((r) => r.sector).filter(Boolean) as string[];
  const cities = distinctCities.map((r) => r.city).filter(Boolean) as string[];
  const countries = distinctCountries.map((r) => r.country).filter(Boolean) as string[];

  return (
    <div>
      <PageHeader
        title="Clientes & CRM"
        description={`${totalCount.toLocaleString()} contactos en total`}
        breadcrumbs={[{ label: "CRM" }]}
        primaryAction={<NewClientDialog />}
      />
      <CrmList
        clients={clientsWithContactors}
        stats={stats}
        webPresenceStats={webPresenceMap}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={pageNum}
        sectors={sectors}
        cities={cities}
        countries={countries}
      />
    </div>
  );
}
