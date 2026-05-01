export default function SettingsLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-8 pb-4 animate-fade-in">
      <aside className="w-[240px] shrink-0 space-y-6">
        <div className="h-8 w-32 rounded bg-secondary animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-secondary animate-pulse" />
          ))}
        </div>
      </aside>
      <main className="flex-1 space-y-8 pr-2">
        <div className="h-8 w-48 rounded bg-secondary animate-pulse" />
        <div className="h-32 rounded bg-secondary animate-pulse" />
        <div className="h-32 rounded bg-secondary animate-pulse" />
      </main>
    </div>
  );
}
