"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportFinancesCSVAction } from "@/lib/db/actions/finances";

export function ExportCSVButton() {
  return (
    <Button variant="outline" onClick={async () => {
      const csv = await exportFinancesCSVAction();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finanzas-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }}>
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
}
