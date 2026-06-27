import { ResponsiveLayout } from "@/components/os/layout/ResponsiveLayout";
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
    <ResponsiveLayout user={session}>
      {children}
      <CommandMenu />
      <QuickIdeaModal />
      <QuickTaskProvider projects={allProjects} users={allUsers} currentUserId={session?.userId} />
      <GlobalHotkeysWrapper />
      <ToasterVertrex />
    </ResponsiveLayout>
  );
}
