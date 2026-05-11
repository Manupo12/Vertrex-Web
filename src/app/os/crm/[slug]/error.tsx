"use client";
import { ErrorState } from "@/components/ui/error-state";
import Link from "next/link";

export default function CrmDetailError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="space-y-4">
      <ErrorState title="Error al cargar cliente" message={error.message} onRetry={reset} />
      <div className="text-center">
        <Link href="/os/crm" className="text-sm text-primary hover:underline">Volver a CRM</Link>
      </div>
    </div>
  );
}
