import { notFound } from 'next/navigation'

import AIConsolePage from '@/app/_os/(os)/ai/page'
import AnalyticsBIPage from '@/app/_os/(os)/analytics/page'
import AssetsPage from '@/app/_os/(os)/assets/page'
import AutomationBuilderPage from '@/app/_os/(os)/automations/page'
import AgendaPage from '@/app/_os/(os)/calendar/page'
import ChatWorkspacePage from '@/app/_os/(os)/chat/page'
import CRMPage from '@/app/_os/(os)/crm/page'
import DocumentEditorPage from '@/app/_os/(os)/docs/[id]/page'
import DocumentGeneratorPage from '@/app/_os/(os)/docs/generator/page'
import DocumentsPage from '@/app/_os/(os)/docs/page'
import FinanceDashboardPage from '@/app/_os/(os)/finance/page'
import HealthPage from '@/app/_os/(os)/health/page'
import KnowledgeHubPage from '@/app/_os/(os)/hub/page'
import LegalOpsPage from '@/app/_os/(os)/legal/page'
import GrowthAcquisitionPage from '@/app/_os/(os)/marketing/page'
import MyDayPage from '@/app/_os/(os)/my-day/page'
import DashboardPage from '@/app/_os/(os)/page'
import ProjectOverviewPage from '@/app/_os/(os)/projects/[id]/page'
import ProjectGraphViewPage from '@/app/_os/(os)/projects/graph/page'
import ProjectsPage from '@/app/_os/(os)/projects/page'
import ProjectTimelineViewPage from '@/app/_os/(os)/projects/timeline/page'
import DecisionSandboxPage from '@/app/_os/(os)/sandbox/page'
import SettingsPage from '@/app/_os/(os)/settings/page'
import StrategyControlCenterPage from '@/app/_os/(os)/strategy/page'
import TeamManagementPage from '@/app/_os/(os)/team/page'
import IntelligentTimeTrackingPage from '@/app/_os/(os)/time/page'
import TicketsPage from '@/app/_os/(os)/tickets/page'
import VaultPage from '@/app/_os/(os)/vault/page'
import KbPage from '@/app/_os/(os)/kb/page'

type OSRouteRendererProps = {
  path?: string[]
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export function renderOSRoute({ path = [], searchParams }: OSRouteRendererProps) {
  const [segment, nested] = path

  if (path.length === 0) {
    return <DashboardPage />
  }

  switch (segment) {
    case 'ai':
      return path.length === 1 ? <AIConsolePage searchParams={searchParams as Promise<{ tab?: string | string[] }> | undefined} /> : notFound()
    case 'analytics':
      return path.length === 1 ? <AnalyticsBIPage /> : notFound()
    case 'assets':
      return path.length === 1 ? <AssetsPage /> : notFound()
    case 'automations':
      return path.length === 1 ? <AutomationBuilderPage /> : notFound()
    case 'calendar':
      return path.length === 1 ? <AgendaPage /> : notFound()
    case 'chat':
      return path.length === 1 ? <ChatWorkspacePage /> : notFound()
    case 'crm':
      return path.length === 1 ? <CRMPage /> : notFound()
    case 'docs':
      if (path.length === 1) {
        return <DocumentsPage />
      }

      if (nested === 'generator' && path.length === 2) {
        return <DocumentGeneratorPage />
      }

      return nested && path.length === 2 ? <DocumentEditorPage params={Promise.resolve({ id: nested })} /> : notFound()
    case 'finance':
      return path.length === 1 ? <FinanceDashboardPage /> : notFound()
    case 'health':
      return path.length === 1 ? <HealthPage /> : notFound()
    case 'hub':
      return path.length === 1 ? <KnowledgeHubPage /> : notFound()
    case 'legal':
      return path.length === 1 ? <LegalOpsPage /> : notFound()
    case 'marketing':
      return path.length === 1 ? <GrowthAcquisitionPage /> : notFound()
    case 'my-day':
      return path.length === 1 ? <MyDayPage /> : notFound()
    case 'projects':
      if (path.length === 1) {
        return <ProjectsPage />
      }

      if (nested === 'graph' && path.length === 2) {
        return <ProjectGraphViewPage />
      }

      if (nested === 'timeline' && path.length === 2) {
        return <ProjectTimelineViewPage />
      }

      return nested && path.length === 2 ? <ProjectOverviewPage /> : notFound()
    case 'sandbox':
      return path.length === 1 ? <DecisionSandboxPage /> : notFound()
    case 'settings':
      return path.length === 1 ? <SettingsPage /> : notFound()
    case 'strategy':
      return path.length === 1 ? <StrategyControlCenterPage /> : notFound()
    case 'team':
      return path.length === 1 ? <TeamManagementPage /> : notFound()
    case 'time':
      return path.length === 1 ? <IntelligentTimeTrackingPage /> : notFound()
    case 'tickets':
      return path.length === 1 ? <TicketsPage /> : notFound()
    case 'vault':
      return path.length === 1 ? <VaultPage /> : notFound()
    case 'kb':
      return path.length === 1 ? <KbPage /> : notFound()
    default:
      return notFound()
  }
}
