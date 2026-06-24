"use client";

import { useState, useMemo } from "react";
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RELATION_REGISTRY, type RelationType } from "@/lib/entities/relations";

interface LinkSnapshot {
  id: string;
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  relationType: string;
}

interface NodeInfo {
  id: string;
  label: string;
  type: string;
  href: string;
}

interface GraphExplorerProps {
  initialLinks: LinkSnapshot[];
  nodeInfos: Record<string, { label: string; type: string; href: string }>;
}

export function GraphExplorer({ initialLinks, nodeInfos }: GraphExplorerProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRelation, setSelectedRelation] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    const links = initialLinks.filter(l => {
      const matchesRelation = selectedRelation === "all" || l.relationType === selectedRelation;
      const sourceInfo = nodeInfos[l.sourceId];
      const targetInfo = nodeInfos[l.targetId];
      
      const matchesType = selectedType === "all" || 
        (sourceInfo?.type === selectedType || targetInfo?.type === selectedType);

      const matchesSearch = !search || 
        (sourceInfo?.label.toLowerCase().includes(search.toLowerCase()) || 
         targetInfo?.label.toLowerCase().includes(search.toLowerCase()));

      return matchesRelation && matchesType && matchesSearch;
    });

    const activeNodeIds = new Set<string>();
    links.forEach(l => {
      activeNodeIds.add(l.sourceId);
      activeNodeIds.add(l.targetId);
    });

    if (search || selectedType !== "all") {
      Object.entries(nodeInfos).forEach(([id, info]) => {
        const matchesType = selectedType === "all" || info.type === selectedType;
        const matchesSearch = !search || info.label.toLowerCase().includes(search.toLowerCase());
        if (matchesType && matchesSearch) {
          activeNodeIds.add(id);
        }
      });
    } else if (activeNodeIds.size === 0) {
      Object.keys(nodeInfos).forEach(id => activeNodeIds.add(id));
    }

    const nodesList: NodeInfo[] = [];
    activeNodeIds.forEach(id => {
      const info = nodeInfos[id];
      if (info) {
        nodesList.push({ id, ...info });
      }
    });

    const cols = Math.ceil(Math.sqrt(nodesList.length)) || 1;
    const nodes: Node[] = nodesList.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        id: n.id,
        position: { x: col * 260, y: row * 200 },
        data: {
          label: (
            <div className="p-2 text-center font-medium">
              <div className="truncate max-w-[180px] font-bold text-sm" title={n.label}>{n.label}</div>
              <div className="text-[9px] text-muted-foreground uppercase">{n.type}</div>
              <a
                href={n.href}
                className="mt-2 inline-block px-2 py-0.5 text-[9px] bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded border border-border transition-colors"
              >
                Ver detalle
              </a>
            </div>
          )
        },
        style: { background: "#111", color: "#ccc", border: "1px solid #333", borderRadius: "8px", width: "200px" }
      };
    });

    const edges: Edge[] = [];
    links.forEach(l => {
      if (activeNodeIds.has(l.sourceId) && activeNodeIds.has(l.targetId)) {
        const relDef = RELATION_REGISTRY[l.relationType as RelationType];
        const edgeLabel = relDef ? relDef.label : l.relationType;

        let strokeColor = "#666";
        if (l.relationType === "blocks") strokeColor = "#ef4444";
        else if (l.relationType === "blocked_by") strokeColor = "#f97316";
        else if (l.relationType === "mentions" || l.relationType === "mentioned_by") strokeColor = "#10b981";
        else if (l.relationType === "relates_to") strokeColor = "#3b82f6";

        edges.push({
          id: l.id,
          source: l.sourceId,
          target: l.targetId,
          animated: true,
          label: edgeLabel,
          labelStyle: { fill: "#aaa", fontSize: 9, fontWeight: 500 },
          labelBgStyle: { fill: "#111", fillOpacity: 0.8 },
          style: { stroke: strokeColor, strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }
        });
      }
    });

    return { nodes, edges };
  }, [initialLinks, nodeInfos, selectedType, selectedRelation, search]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useMemo(() => {
    setNodes(filteredData.nodes);
    setEdges(filteredData.edges);
  }, [filteredData, setNodes, setEdges]);

  const types = useMemo(() => {
    const set = new Set<string>();
    Object.values(nodeInfos).forEach(n => set.add(n.type));
    return Array.from(set);
  }, [nodeInfos]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por nombre de entidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)]"
          />
        </div>
        <div>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)]"
          >
            <option value="all">Todos los tipos</option>
            {types.map(t => (
              <option key={t} value={t}>{t.toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={selectedRelation}
            onChange={e => setSelectedRelation(e.target.value)}
            className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm text-[var(--color-foreground)]"
          >
            <option value="all">Todas las relaciones</option>
            {Object.keys(RELATION_REGISTRY).map(r => (
              <option key={r} value={r}>{RELATION_REGISTRY[r as RelationType].label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="w-full h-[650px] border border-border rounded-xl bg-black overflow-hidden relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          colorMode="dark"
        >
          <Background gap={16} color="#222" />
          <Controls />
          <MiniMap nodeColor="#22c55e" maskColor="rgba(0,0,0,0.5)" style={{ backgroundColor: "#111" }} />
        </ReactFlow>
      </div>
    </div>
  );
}
