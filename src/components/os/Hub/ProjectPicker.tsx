"use client";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProjectPicker({ initialProjectId, onSelect, projects }: { initialProjectId: string | null, onSelect: (id: string | null) => void, projects: Array<{id: string, name: string}> }) {
  return (
    <Select value={initialProjectId || "none"} onValueChange={(val) => onSelect(val === "none" ? null : val)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Seleccionar proyecto..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Ninguno</SelectItem>
        {projects.map(p => (
          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}