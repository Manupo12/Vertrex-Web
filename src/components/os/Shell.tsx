import { Sidebar } from "@/components/os/layout/Sidebar";
import { Topbar } from "@/components/os/layout/Topbar";
import { ToasterVertrex } from "@/components/ui/toaster";
import { CommandMenu } from "@/components/os/CommandMenu";
import { QuickIdeaModal } from "@/components/os/Hub/QuickIdeaModal";
import { getOsSession } from "@/lib/auth/session";
import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

export async function Shell({ children }: ShellProps) {
  const user = await getOsSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandMenu />
      <QuickIdeaModal />
      <ToasterVertrex />
    </div>
  );
}
