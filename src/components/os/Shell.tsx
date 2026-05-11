import { Sidebar } from "@/components/os/layout/Sidebar";
import { Topbar } from "@/components/os/layout/Topbar";
import { ToasterVertrex } from "@/components/ui/toaster";
import { CommandMenu } from "@/components/os/CommandMenu";
import { QuickIdeaModal } from "@/components/os/Hub/QuickIdeaModal";
import { QuickTaskProvider } from "@/components/os/Tasks/QuickTaskProvider";
import { GlobalHotkeysWrapper } from "@/components/os/Shortcuts/GlobalHotkeysWrapper";
import { getOsSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { projects, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ReactNode } from "react";

interface ShellProps {
  children: ReactNode;
}

export async function Shell({ children }: ShellProps) {
  const session = await getOsSession();
  const allProjects = await db.select().from(projects).where(eq(projects.status, "active"));
  const allUsers = await db.select().from(users).where(eq(users.isActive, true));

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <CommandMenu />
      <QuickIdeaModal />
      <QuickTaskProvider projects={allProjects} users={allUsers} currentUserId={session?.userId} />
      <GlobalHotkeysWrapper />
      <ToasterVertrex />
    </div>
  );
}
