"use client";

import { useEffect, useCallback } from "react";
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType, Edge, Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

interface EntityGraphProps {
  entityId: string;
  connections: Array<{
    id: string;
    type: string;
    label: string;
    subtitle: string;
    isSource: boolean;
  }>;
  entityLabel: string;
  entityType: string;
}

export function EntityGraph({ entityId, connections, entityLabel, entityType }: EntityGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const generateGraph = useCallback(() => {
    const centerNode: Node = {
      id: entityId,
      position: { x: 400, y: 300 },
      data: { label: <div className="p-2 text-center font-bold">{entityLabel}<br/><span className="text-xs font-normal text-muted-foreground">{entityType}</span></div> },
      style: { background: '#1a1a1a', color: '#fff', border: '2px solid #22c55e', borderRadius: '8px', minWidth: '150px' }
    };

    const newNodes: Node[] = [centerNode];
    const newEdges: Edge[] = [];

    const radius = 250;
    const angleStep = (2 * Math.PI) / (connections.length || 1);

    connections.forEach((conn, i) => {
      const angle = i * angleStep;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      newNodes.push({
        id: conn.id,
        position: { x, y },
        data: { label: <div className="p-1 text-center font-medium">{conn.label}<br/><span className="text-[10px] font-normal text-muted-foreground">{conn.type}</span></div> },
        style: { background: '#111', color: '#ccc', border: '1px solid #333', borderRadius: '8px' }
      });

      if (conn.isSource) {
        newEdges.push({
          id: `e-${entityId}-${conn.id}`,
          source: entityId,
          target: conn.id,
          animated: true,
          style: { stroke: '#555' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#555' }
        });
      } else {
        newEdges.push({
          id: `e-${conn.id}-${entityId}`,
          source: conn.id,
          target: entityId,
          animated: true,
          style: { stroke: '#555' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#555' }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [entityId, connections, entityLabel, entityType, setNodes, setEdges]);

  useEffect(() => {
    generateGraph();
  }, [generateGraph]);

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
        <MiniMap nodeColor="#22c55e" maskColor="rgba(0,0,0,0.5)" style={{ backgroundColor: '#111' }} />
      </ReactFlow>
    </div>
  );
}
