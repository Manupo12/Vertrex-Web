import { renderOSRoute } from '@/lib/os-route-renderer'

export const dynamic = 'force-dynamic'

type OSCatchAllPageProps = {
  params: Promise<{ path: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function OSCatchAllPage({ params, searchParams }: OSCatchAllPageProps) {
  const { path } = await params
  return renderOSRoute({ path, searchParams })
}
