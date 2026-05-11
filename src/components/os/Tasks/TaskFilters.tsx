"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { TextInput, Select, Group, ActionIcon, Tooltip } from "@mantine/core";
import { Search, X } from "lucide-react";

export interface TaskFilterValues {
  state: string;
  priority: string;
  assigneeId: string;
  cycleId: string;
  milestoneId: string;
  tagId: string;
  search: string;
  groupBy: string;
}

export interface TaskFiltersProps {
  filters?: Partial<TaskFilterValues>;
  onChange?: (filters: TaskFilterValues) => void;
  onReset?: () => void;
  users?: Array<{ id: string; name: string }>;
  cycles?: Array<{ id: string; name: string }>;
  milestones?: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; label: string }>;
  projects?: Array<{ id: string; name: string }>;
}

const DEFAULT_FILTERS: TaskFilterValues = {
  state: "",
  priority: "",
  assigneeId: "",
  cycleId: "",
  milestoneId: "",
  tagId: "",
  search: "",
  groupBy: "",
};

const STATES = [
  { value: "", label: "Todos" },
  { value: "backlog", label: "En lista de espera" },
  { value: "todo", label: "Pendiente" },
  { value: "in_progress", label: "En desarrollo" },
  { value: "in_review", label: "En revisión" },
  { value: "done", label: "Listo" },
  { value: "cancelled", label: "Cancelado" },
];

const PRIORITIES = [
  { value: "", label: "Todas" },
  { value: "1", label: "Urgente" },
  { value: "2", label: "Alta" },
  { value: "3", label: "Media" },
  { value: "4", label: "Baja" },
];

const GROUP_OPTIONS = [
  { value: "", label: "Ninguno" },
  { value: "state", label: "Estado" },
  { value: "assignee", label: "Asignado" },
  { value: "cycle", label: "Ciclo" },
  { value: "milestone", label: "Hito" },
  { value: "priority", label: "Prioridad" },
];

function filtersToParams(filters: TaskFilterValues): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  return params;
}

function paramsToFilters(params: URLSearchParams): TaskFilterValues {
  const filters: TaskFilterValues = { ...DEFAULT_FILTERS };
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    const val = params.get(key);
    if (val) (filters as any)[key] = val;
  }
  return filters;
}

export default function TaskFilters({
  filters: externalFilters,
  onChange,
  onReset,
  users = [],
  cycles = [],
  milestones = [],
  tags = [],
}: TaskFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<TaskFilterValues>(() =>
    paramsToFilters(searchParams)
  );
  const [searchValue, setSearchValue] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilters(paramsToFilters(searchParams));
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const updateFilters = useCallback(
    (updated: TaskFilterValues) => {
      setFilters(updated);
      onChange?.(updated);

      const params = filtersToParams(updated);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [onChange, router, pathname]
  );

  const setFilter = useCallback(
    (key: keyof TaskFilterValues, value: string) => {
      updateFilters({ ...filters, [key]: value });
    },
    [filters, updateFilters]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilter("search", value);
      }, 300);
    },
    [setFilter]
  );

  const handleReset = useCallback(() => {
    setSearchValue("");
    updateFilters({ ...DEFAULT_FILTERS });
    onReset?.();
  }, [updateFilters, onReset]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <Group gap="xs" wrap="wrap" align="end">
      <TextInput
        placeholder="Buscar tareas..."
        leftSection={<Search className="h-4 w-4" />}
        value={searchValue}
        onChange={(e) => handleSearchChange(e.currentTarget.value)}
        className="w-56"
        size="sm"
      />

      <Select
        placeholder="Estado"
        data={STATES}
        value={filters.state}
        onChange={(val) => setFilter("state", val || "")}
        size="sm"
        className="w-36"
        clearable
      />

      <Select
        placeholder="Prioridad"
        data={PRIORITIES}
        value={filters.priority}
        onChange={(val) => setFilter("priority", val || "")}
        size="sm"
        className="w-32"
        clearable
      />

      {users.length > 0 && (
        <Select
          placeholder="Asignado"
          data={[
            { value: "", label: "Todos" },
            ...users.map((u) => ({ value: u.id, label: u.name })),
          ]}
          value={filters.assigneeId}
          onChange={(val) => setFilter("assigneeId", val || "")}
          size="sm"
          className="w-36"
          clearable
        />
      )}

      {cycles.length > 0 && (
        <Select
          placeholder="Ciclo"
          data={[
            { value: "", label: "Todos" },
            ...cycles.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={filters.cycleId}
          onChange={(val) => setFilter("cycleId", val || "")}
          size="sm"
          className="w-36"
          clearable
        />
      )}

      {milestones.length > 0 && (
        <Select
          placeholder="Hito"
          data={[
            { value: "", label: "Todos" },
            ...milestones.map((m) => ({ value: m.id, label: m.name })),
          ]}
          value={filters.milestoneId}
          onChange={(val) => setFilter("milestoneId", val || "")}
          size="sm"
          className="w-36"
          clearable
        />
      )}

      <Select
        placeholder="Agrupar"
        data={GROUP_OPTIONS}
        value={filters.groupBy}
        onChange={(val) => setFilter("groupBy", val || "")}
        size="sm"
        className="w-32"
        clearable
      />

      {hasActiveFilters && (
        <Tooltip label="Limpiar filtros">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={handleReset}
            size="lg"
          >
            <X className="h-4 w-4" />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  );
}
