import type { ReactNode } from "react";
import { ToasterVertrex } from "@/components/ui/toaster";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-6">{children}</div>
      <ToasterVertrex />
    </div>
  );
}
