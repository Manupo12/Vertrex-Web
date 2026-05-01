import DashboardOverviewScreen from "@/components/os/dashboard-overview-screen";
import { getOperationalStatsSnapshot } from "@/lib/dashboard/operational-stats";
import { getRecentBusinessEvents } from "@/lib/ops/business-event-service";
import { buildWorkspaceHealthSnapshot } from "@/lib/ops/workspace-health";
import { getWorkspaceSnapshot } from "@/lib/ops/workspace-service";

export const dynamic = 'force-dynamic'

export default async function OSPage() {
  const statsSnapshot = await getOperationalStatsSnapshot();
  const workspaceSnapshot = await getWorkspaceSnapshot();
  const healthSnapshot = buildWorkspaceHealthSnapshot(workspaceSnapshot);
  const businessEvents = await getRecentBusinessEvents({ limit: 12 });

  return <DashboardOverviewScreen statsSnapshot={statsSnapshot} workspaceSnapshot={workspaceSnapshot} healthSnapshot={healthSnapshot} businessEvents={businessEvents} />;
}
