"use client";

import { useState } from "react";
import { ApprovalCard } from "@/components/os/Approvals/ApprovalCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2Icon } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ApprovalsView({ initialApprovals }: { initialApprovals: any[] }) {
  const [items, setItems] = useState(initialApprovals);

  const handleRespond = async (id: string, status: string, note?: string) => {
    try {
      // In a real implementation this would call a server action
      setItems(items.map(a => a.id === id ? { 
        ...a, 
        status, 
        responseNote: note, 
        respondedAt: new Date(),
        respondedBy: "current_portal_user" // mocked
      } : a));
      toast.success("Respuesta enviada correctamente");
    } catch (e) {
      toast.error("Error al enviar la respuesta");
    }
  };

  const pending = items.filter(a => a.status === "pending");
  const responded = items.filter(a => a.status !== "pending");

  const renderList = (list: any[]) => {
    if (list.length === 0) {
      return (
        <div className="mt-8">
          <EmptyState 
            icon={CheckCircle2Icon} 
            title="Todo al día" 
            description="No hay solicitudes de aprobación pendientes de tu revisión." 
          />
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-6">
        {list.map(a => (
          <ApprovalCard 
            key={a.id} 
            approval={a} 
            isClientView 
            onRespond={handleRespond} 
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pendientes ({pending.length})</TabsTrigger>
          <TabsTrigger value="responded">Respondidas ({responded.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          {renderList(pending)}
        </TabsContent>
        <TabsContent value="responded">
          {renderList(responded)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
