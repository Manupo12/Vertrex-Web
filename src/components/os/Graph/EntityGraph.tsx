"use client";

import { useEffect, useCallback } from "react";
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RELATION_REGISTRY, type RelationType } from "@/lib/entities/relations";
import { EntityConnectSheet } from "@/components/os/actions/EntityConnectSheet";
import { ConfirmActionDialog } from "@/components/os/actions/ConfirmActionDialog";
import { getResolvedEntityConnections, unlinkEntity } from "@/lib/db/actions/graph";
import type { EntityType } from "@/lib/db/actions/graph-types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EntityGraphProps {
  entityId: string;
  connections: Array<{
    id: string;
    type: string;
    label: string;
    subtitle: string;
    isSource: boolean;
    relationType?: string;
    linkId: string;
  }>;
  entityLabel: string;
  entityType: string;
}

export function EntityGraph({ entityId, connections, entityLabel, entityType }: EntityGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const router = useRouter();

  const entityTypeNormalized = (
    entityType.toLowerCase() === "cliente" ? "client" :
    entityType.toLowerCase() === "proyecto" ? "project" :
    entityType.toLowerCase() === "repositorio" ? "repository" :
    entityType.toLowerCase() === "link" ? "link" : "project"
  ) as EntityType;

  const handleUnlink = async (linkId: string) => {
    try {
      await unlinkEntity(linkId);
      toast.success("Conexión eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar conexión");
    }
  };

  const handleExpand = async (nodeId: string, nodeLabel: string, nodeType: string) => {
    try {
      const conns = await getResolvedEntityConnections(nodeId);
      if (conns.length === 0) {
        toast.info("No hay conexiones adicionales para esta entidad");
        return;
      }

      setNodes((currentNodes) => {
        const parentNode = currentNodes.find(n => n.id === nodeId);
        const px = parentNode ? parentNode.position.x : 400;
        const py = parentNode ? parentNode.position.y : 300;

        const updatedNodes = [...currentNodes];
        const radius = 220;
        const angleStep = (2 * Math.PI) / (conns.length || 1);

        conns.forEach((conn, i) => {
          if (!updatedNodes.some(n => n.id === conn.id)) {
            const angle = i * angleStep;
            const x = px + radius * Math.cos(angle);
            const y = py + radius * Math.sin(angle);
            updatedNodes.push(createEntityNode(conn, x, y));
          }
        });
        return updatedNodes;
      });

      setEdges((currentEdges) => {
        const updatedEdges = [...currentEdges];
        conns.forEach((conn) => {
          const sourceNode = conn.isSource ? nodeId : conn.id;
          const targetNode = conn.isSource ? conn.id : nodeId;
          const edgeId = `e-${sourceNode}-${targetNode}`;

          if (!updatedEdges.some(e => e.id === edgeId)) {
            const relDef = RELATION_REGISTRY[conn.relationType as RelationType];
            const edgeLabel = relDef ? relDef.label : conn.relationType || "";

            let strokeColor = "#666";
            if (conn.relationType === "blocks") strokeColor = "#ef4444";
            else if (conn.relationType === "blocked_by") strokeColor = "#f97316";
            else if (conn.relationType === "mentions" || conn.relationType === "mentioned_by") strokeColor = "#10b981";
            else if (conn.relationType === "relates_to") strokeColor = "#3b82f6";

            updatedEdges.push({
              id: edgeId,
              source: sourceNode,
              target: targetNode,
              animated: true,
              label: edgeLabel,
              labelStyle: { fill: "#aaa", fontSize: 10, fontWeight: 500 },
              labelBgStyle: { fill: "#111", fillOpacity: 0.8 },
              style: { stroke: strokeColor, strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }
            });
          }
        });
        return updatedEdges;
      });
      toast.success("Grafo expandido");
    } catch {
      toast.error("Error al expandir el grafo");
    }
  };

  const createEntityNode = useCallback((conn: any, x: number, y: number): Node => {
    return {
      id: conn.id,
      position: { x, y },
      data: {
        label: (
          <div className="p-2 text-center font-medium">
            <div className="truncate max-w-[150px] font-bold text-sm" title={conn.label}>{conn.label}</div>
            <div className="text-[9px] text-muted-foreground uppercase">{conn.type}</div>
            <div className="mt-2 flex justify-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand(conn.id, conn.label, conn.type);
                }}
                className="px-2 py-0.5 text-[9px] bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded transition-colors"
              >
                Expandir
              </button>
              <ConfirmActionDialog
                title="Quitar conexión"
                description={`¿Seguro que deseas desconectar esta entidad?`}
                confirmLabel="Desconectar"
                onConfirm={() => handleUnlink(conn.linkId)}
                trigger={
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-0.5 text-[9px] bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 rounded transition-colors"
                  >
                    Quitar
                  </button>
                }
              />
            </div>
          </div>
        )
      },
      style: { background: "#111", color: "#ccc", border: "1px solid #333", borderRadius: "8px", minWidth: "160px" }
    };
  }, []);

  useEffect(() => {
    const centerNode: Node = {
      id: entityId,
      position: { x: 400, y: 300 },
      data: {
        label: (
          <div className="p-2 text-center font-bold">
            <div className="truncate max-w-[170px]">{entityLabel}</div>
            <div className="text-xs font-normal text-muted-foreground uppercase">{entityType}</div>
            <div className="mt-2 flex justify-center">
              <EntityConnectSheet sourceId={entityId} sourceType={entityTypeNormalized} />
            </div>
          </div>
        )
      },
      style: { background: "#1a1a1a", color: "#fff", border: "2px solid #22c55e", borderRadius: "8px", minWidth: "180px" }
    };

    const initialNodes: Node[] = [centerNode];
    const initialEdges: Edge[] = [];

    const radius = 240;
    const angleStep = (2 * Math.PI) / (connections.length || 1);

    connections.forEach((conn, i) => {
      const angle = i * angleStep;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      initialNodes.push(createEntityNode(conn, x, y));

      const relDef = RELATION_REGISTRY[conn.relationType as RelationType];
      const edgeLabel = relDef ? relDef.label : conn.relationType || "";

      let strokeColor = "#666";
      if (conn.relationType === "blocks") strokeColor = "#ef4444";
      else if (conn.relationType === "blocked_by") strokeColor = "#f97316";
      else if (conn.relationType === "mentions" || conn.relationType === "mentioned_by") strokeColor = "#10b981";
      else if (conn.relationType === "relates_to") strokeColor = "#3b82f6";

      const sourceNode = conn.isSource ? entityId : conn.id;
      const targetNode = conn.isSource ? conn.id : entityId;

      initialEdges.push({
        id: `e-${sourceNode}-${targetNode}`,
        source: sourceNode,
        target: targetNode,
        animated: true,
        label: edgeLabel,
        labelStyle: { fill: "#aaa", fontSize: 10, fontWeight: 500 },
        labelBgStyle: { fill: "#111", fillOpacity: 0.8 },
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor }
      });
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [entityId, connections, entityLabel, entityType, createEntityNode, entityTypeNormalized, setNodes, setEdges]);

  return (
    <div className="w-full h-[600px] border border-border rounded-xl bg-black overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        colorMode="dark"
      >
        <Background gap={16} color="#333" />
        <Controls />
        <MiniMap nodeColor="#22c55e" maskColor="rgba(0,0,0,0.5)" style={{ backgroundColor: "#111" }} />
      </ReactFlow>
    </div>
  );
}
