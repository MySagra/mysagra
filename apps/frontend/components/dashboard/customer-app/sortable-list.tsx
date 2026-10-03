"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { GripVerticalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";

interface SortableListProps<T extends { id: string }> {
  dndId: string;
  items: T[];
  selectedId: string | null;
  canReorder: boolean;
  itemName: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onSelect: (item: T) => void;
  onReorder: (reordered: T[]) => void;
}

/** Lista selezionabile e riordinabile, stesso stile delle categorie del menù. */
export function SortableList<T extends { id: string }>({
  dndId,
  items,
  selectedId,
  canReorder,
  itemName,
  renderItem,
  onSelect,
  onReorder,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1">
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              id={item.id}
              name={itemName(item)}
              selected={item.id === selectedId}
              canReorder={canReorder}
              onSelect={() => onSelect(item)}
            >
              {renderItem(item, index)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  name,
  selected,
  canReorder,
  onSelect,
  children,
}: {
  id: string;
  name: string;
  selected: boolean;
  canReorder: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  const { t } = useLocale();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !canReorder });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("group/row relative", isDragging && "z-10 opacity-80")}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2 pr-8 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
          selected && "bg-muted hover:bg-muted"
        )}
      >
        {children}
      </button>
      {canReorder && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`${t.customerApp.dragToReorder}: ${name}`}
          className="absolute top-1/2 right-1 -translate-y-1/2 cursor-grab touch-none rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover/row:opacity-100 focus-visible:opacity-100 active:cursor-grabbing pointer-coarse:opacity-100"
        >
          <GripVerticalIcon className="size-4" />
        </button>
      )}
    </li>
  );
}
