"use client";
import { Button } from "@/components/ui/button";

export default function LinksError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <h2 className="text-xl font-bold text-white">Error en Links</h2>
      <p className="text-gray-500">{error.message}</p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
