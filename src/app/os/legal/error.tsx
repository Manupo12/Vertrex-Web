"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function LegalError({ error, reset }: { error: Error; reset: () => void }) { return <ErrorState title="Error" message={error.message} onRetry={reset} />; }
