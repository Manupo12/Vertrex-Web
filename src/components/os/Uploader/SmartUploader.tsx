"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SmartUploaderProps {
  source?: "os" | "portal";
  onUploaded?: (doc?: any) => void;
  variant?: "button" | "dropzone";
  className?: string;
}

export function SmartUploader({ source = "os", onUploaded, variant = "button", className = "" }: SmartUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("source", source);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Error");
      const doc = await res.json();
      toast.success(source === "portal" ? "Archivo subido correctamente" : `Subido a ${doc.storageProvider === "drive" ? "Drive" : "Neon"}`);
      if (fileRef.current) fileRef.current.value = "";
      if (onUploaded) onUploaded(doc);
      else router.refresh();
    } catch { 
      toast.error("Error al subir archivo"); 
      if (fileRef.current) fileRef.current.value = "";
    }
    setUploading(false);
  };

  if (variant === "dropzone") {
    return (
      <div className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${uploading ? 'bg-gray-50 border-gray-400' : 'border-gray-300 bg-white hover:border-gray-400'} ${className}`}>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        <Upload className={`mx-auto h-10 w-10 mb-3 ${uploading ? 'text-gray-500 animate-pulse' : 'text-gray-400'}`} />
        <p className="text-lg font-medium mb-2 text-gray-900">{uploading ? "Subiendo tu archivo..." : "Subir archivo"}</p>
        <p className="text-gray-500 mb-4">{uploading ? "Por favor, espera un momento." : "Arrastra un archivo o haz clic para seleccionar"}</p>
        <Button size="lg" onClick={() => fileRef.current?.click()} disabled={uploading} className="bg-green-600 hover:bg-green-700 text-white">{uploading ? "Subiendo..." : "Seleccionar archivo"}</Button>
      </div>
    );
  }

  return (
    <>
      <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className={className}>
        <Upload className="mr-2 h-4 w-4" />{uploading ? "Subiendo..." : "Subir"}
      </Button>
    </>
  );
}
