import { Shell } from "@/components/os/Shell";
import { requireOsUser } from "@/lib/auth/session";
import type { ReactNode } from "react";

export default async function OsLayout({ children }: { children: ReactNode }) {
  await requireOsUser();
  return <Shell>{children}</Shell>;
}
