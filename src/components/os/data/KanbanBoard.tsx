"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

interface KanbanItem {
  id: string;
  status: string;
  [key: string]: any;
}

interface KanbanColumn {
  id: string;
  label: string;
  color?: string;
}

interface KanbanBoardProps {
  items: KanbanItem[];
  columns: KanbanColumn[];
  renderItem: (item: KanbanItem) => React.ReactNode;
  onItemMove: (itemId: string, newStatus: string) => Promise<void>;
}

export function KanbanBoard({ items, columns, renderItem, onItemMove }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<KanbanItem[]>(items);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = localItems.find((i) => i.id === activeId);
    if (!activeItem) return;

    // Find if we are hovering over a column or an item
    const overColumn = columns.find((c) => c.id === overId);
    const overItem = localItems.find((i) => i.id === overId);

    if (overColumn) {
      if (activeItem.status !== overColumn.id) {
        setLocalItems((prev) =>
          prev.map((i) => (i.id === activeId ? { ...i, status: overColumn.id } : i))
        );
      }
    } else if (overItem) {
      if (activeItem.status !== overItem.status) {
        setLocalItems((prev) =>
          prev.map((i) => (i.id === activeId ? { ...i, status: overItem.status } : i))
        );
      }
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeItem = localItems.find((i) => i.id === activeId);
    if (!activeItem) {
        setActiveId(null);
        return;
    }

    const overColumn = columns.find((c) => c.id === overId);
    const overItem = localItems.find((i) => i.id === overId);
    const newStatus = overColumn ? overColumn.id : overItem ? overItem.status : activeItem.status;

    if (activeItem.status !== newStatus) {
        try {
            await onItemMove(activeId, newStatus);
        } catch {
            // Revert on error
            setLocalItems(items);
        }
    }

    setActiveId(null);
  };

  const activeItem = activeId ? localItems.find((i) => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <KanbanColumnComponent
            key={col.id}
            column={col}
            items={localItems.filter((i) => i.status === col.id)}
            renderItem={renderItem}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: "0.5",
            },
          },
        }),
      }}>
        {activeItem ? (
          <div className="rotate-3 scale-105 pointer-events-none opacity-80 shadow-2xl">
            {renderItem(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumnComponent({
  column,
  items,
  renderItem,
}: {
  column: KanbanColumn;
  items: KanbanItem[];
  renderItem: (item: KanbanItem) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-3 flex flex-col min-h-[200px]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">
          {column.label}
        </h3>
        <span className="text-xs text-muted-foreground">
          {items.length}
        </span>
      </div>
      
      <SortableContext
        id={column.id}
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 flex-1">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableItem>
          ))}
          {items.length === 0 && (
            <div className="h-20 rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Suelta aqu\u00ed</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}
