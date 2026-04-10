"use client";

import { useState, useEffect } from "react";
import { OrderInstruction } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, GripVerticalIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { useLocale } from "@/contexts/locale-context";

/** Strips markdown syntax and truncates to maxLen chars */
function plainPreview(text: string, maxLen = 20): string {
  const plain = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) → text
    .replace(/\*\*(.+?)\*\*/g, "$1")           // **bold** → bold
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1") // *italic* → italic
    .replace(/`(.+?)`/g, "$1");                // `code` → code
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

interface OrderInstructionsTableProps {
  instructions: OrderInstruction[];
  onEdit: (instruction: OrderInstruction) => void;
  onReorder: (reordered: OrderInstruction[]) => void;
}

function TableHeaders({ t }: { t: any }) {
  return (
    <TableRow className="bg-muted/50">
      <TableHead className="w-10" />
      <TableHead className="w-12 text-center">#</TableHead>
      <TableHead className="font-medium">{t.orderInstructions.columnText}</TableHead>
      <TableHead className="w-10 text-right" />
    </TableRow>
  );
}

function SortableRow({
  instruction,
  onEdit,
  dragLabel,
}: {
  instruction: OrderInstruction;
  onEdit: (instruction: OrderInstruction) => void;
  dragLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instruction.id });

  const style = isDragging
    ? { opacity: 0, position: "relative" as const }
    : {
        transform: CSS.Translate.toString(transform),
        transition,
        position: "relative" as const,
      };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-10">
        <Button variant="ghost" size="icon" onClick={() => onEdit(instruction)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="w-12 text-center text-muted-foreground text-xs">
        {instruction.position + 1}
      </TableCell>
      <TableCell className="font-medium">
        <span className="block truncate" title={instruction.text}>
          {plainPreview(instruction.text)}
        </span>
      </TableCell>
      <TableCell className="w-10 text-right">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing touch-none"
          aria-label={dragLabel}
        >
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
    </TableRow>
  );
}

export function OrderInstructionsTable({
  instructions,
  onEdit,
  onReorder,
}: OrderInstructionsTableProps) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeInstruction = instructions.find((i) => i.id === activeId) ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = instructions.findIndex((i) => i.id === active.id);
    const newIndex = instructions.findIndex((i) => i.id === over.id);

    const reordered = arrayMove(instructions, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: index,
    }));

    onReorder(reordered);
  }

  if (instructions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.orderInstructions.noInstructionsFound}</p>
      </div>
    );
  }

  // SSR version — no DnD to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableHeaders t={t} />
          </TableHeader>
          <TableBody>
            {instructions.map((instruction) => (
              <TableRow key={instruction.id}>
                <TableCell className="w-10">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(instruction)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="w-12 text-center text-muted-foreground text-xs">
                  {instruction.position + 1}
                </TableCell>
                <TableCell className="font-medium">
                  <span className="block truncate" title={instruction.text}>
                    {plainPreview(instruction.text)}
                  </span>
                </TableCell>
                <TableCell className="w-10 text-right">
                  <div className="p-1">
                    <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden relative">
      <DndContext
        id="order-instructions-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <Table>
          <TableHeader>
            <TableHeaders t={t} />
          </TableHeader>
          <SortableContext
            items={instructions.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {instructions.map((instruction) => (
                <SortableRow
                  key={instruction.id}
                  instruction={instruction}
                  onEdit={onEdit}
                  dragLabel={t.orderInstructions.dragToReorder}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
        <DragOverlay>
          {activeInstruction ? (
            <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-3 shadow-lg">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground mr-1">{activeInstruction.position + 1}</span>
              <span className="font-medium truncate max-w-xs">{plainPreview(activeInstruction.text)}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
