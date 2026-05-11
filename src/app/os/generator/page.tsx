"use client";
import { useState, useRef } from "react";
import { PageHeader } from "@/components/os/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2, Download, Upload } from "lucide-react";
import { toast } from "sonner";

export default function GeneratorPage() {
  const [html, setHtml] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const detectVariables = (template: string) => {
    const matches = template.match(/\{\{([^}]+)\}\}/g) || [];
    const vars = [...new Set(matches.map(m => m.slice(2, -2)))];
    setDetectedVars(vars);
    const defaults: Record<string, string> = {};
    vars.forEach(v => { defaults[v] = variables[v] || ""; });
    setVariables(defaults);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { const text = reader.result as string; setHtml(text); detectVariables(text); };
    reader.readAsText(file);
  };

  const replaceVariables = () => {
    let result = html;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    });
    return result;
  };

  const handleDownload = () => {
    const result = replaceVariables();
    const blob = new Blob([result], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template-generado.html"; a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML descargado");
  };

  const preview = html ? replaceVariables() : "";

  return (
    <div>
      <PageHeader title="Generador de plantillas" description="Llena plantillas HTML con variables {{VARIABLE}}" breadcrumbs={[{ label: "Generador" }]} />
      <input ref={fileRef} type="file" accept=".html" className="hidden" onChange={handleFileUpload} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-sm">Plantilla HTML</CardTitle></CardHeader><CardContent>
          <div className="flex gap-2 mb-3">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="mr-2 h-4 w-4" />Cargar .html</Button>
          </div>
          <textarea value={html} onChange={e => { setHtml(e.target.value); detectVariables(e.target.value); }} rows={16} className="w-full rounded-lg border border-border bg-background p-3 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y" placeholder="Pega tu HTML aqui o sube un archivo..."/>
          {html && <p className="text-xs text-muted-foreground mt-1">{detectedVars.length} variables detectadas</p>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-sm">Previsualizacion</CardTitle></CardHeader><CardContent>
          {preview ? (
            <iframe srcDoc={preview} className="h-[400px] w-full rounded-lg border border-border" title="Preview" />
          ) : (
            <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground border border-border rounded-lg">Carga una plantilla para previsualizar</div>
          )}
        </CardContent></Card>
      </div>

      {detectedVars.length > 0 && (
        <Card className="mt-4"><CardHeader><CardTitle className="text-sm">Variables ({detectedVars.length})</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {detectedVars.map(v => (
              <div key={v}><label className="block text-xs font-medium text-muted-foreground mb-1">{`{{${v}}}`}</label><input value={variables[v] || ""} onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            ))}
          </div>
          <Button onClick={handleDownload} className="mt-4"><Download className="mr-2 h-4 w-4" />Descargar HTML generado</Button>
        </CardContent></Card>
      )}

      {html && detectedVars.length === 0 && <p className="mt-4 text-sm text-muted-foreground text-center">No se detectaron variables {"{{VARIABLE}}"}</p>}
    </div>
  );
}
