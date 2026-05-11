"use client";
import { ErrorState } from "@/components/ui/error-state";

export default function ActivityError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorState title="Error" message={error.message} onRetry={reset} />;
}
