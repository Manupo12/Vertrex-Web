"use client";

import { useUIStore } from "@/lib/store/ui";
import TicketsWorkspaceScreen from "@/components/os/tickets-workspace-screen";

export default function TicketsPage() {
  const open = useUIStore((store) => store.open);
  return <TicketsWorkspaceScreen open={open} />;
}
