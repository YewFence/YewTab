import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export type SortableDragHandle = {
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: Record<string, unknown>;
  listeners: Record<string, unknown>;
};

type SortableGridProps = {
  ids: string[];
  disabled?: boolean;
  disabledIds?: Set<string>;
  onReorder: (nextIds: string[]) => void;
  render: (args: {
    id: string;
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    dragHandle: SortableDragHandle | null;
    isDragging: boolean;
    disabled: boolean;
  }) => ReactNode;
};

function SortableItem({
  id,
  disabled,
  render
}: {
  id: string;
  disabled: boolean;
  render: SortableGridProps["render"];
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined
  };

  const dragHandle = disabled
    ? null
    : {
        setActivatorNodeRef,
        attributes: attributes as unknown as Record<string, unknown>,
        listeners: listeners as unknown as Record<string, unknown>
      };

  return render({ id, setNodeRef, style, dragHandle, isDragging, disabled });
}

export default function SortableGrid({ ids, disabled = false, disabledIds, onReorder, render }: SortableGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const disabledSet = useMemo(() => disabledIds ?? new Set<string>(), [disabledIds]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }
    if (active.id === over.id) {
      return;
    }
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        {ids.map((id) => (
          <SortableItem
            key={id}
            id={id}
            disabled={disabled || disabledSet.has(id)}
            render={render}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
