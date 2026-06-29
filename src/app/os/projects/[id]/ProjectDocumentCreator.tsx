"use client";

import { SmartUploader } from "@/components/os/Uploader/SmartUploader";
import { linkEntities } from "@/lib/db/actions/graph";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function ProjectDocumentCreator({ projectId }: { projectId: string }) {
  const router = useRouter();

  const handleUploaded = async (doc: any) => {
    if (doc && doc.id) {
      try {
        await linkEntities(projectId, "project", doc.id, "document");
        toast.success("Documento subido y conectado al proyecto");
        router.refresh();
      } catch {
        toast.error("Error al conectar el documento con el proyecto");
      }
    }
  };

  return (
    <div className="flex justify-end mb-4">
      <SmartUploader 
        source="os" 
        variant="button" 
        onUploaded={handleUploaded} 
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      />
    </div>
  );
}
