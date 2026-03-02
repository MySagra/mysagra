"use client";

import { useState, useEffect } from "react";
import { Category, Printer } from "@/lib/api-types";
import { toggleCategoryAvailability } from "@/actions/categories";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PencilIcon, GripVerticalIcon } from "lucide-react";
import { toast } from "sonner";
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

interface CategoriesTableProps {
  categories: Category[];
  printers: Printer[];
  onEdit: (category: Category) => void;
  onToggle: (updated: Category) => void;
  onReorder: (reordered: Category[]) => void;
}

function SortableRow({
  category,
  printers,
  togglingId,
  onEdit,
  handleToggle,
}: {
  category: Category;
  printers: Printer[];
  togglingId: string | null;
  onEdit: (category: Category) => void;
  handleToggle: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category)}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="font-medium">{category.name}</TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {printers.find((p) => p.id === category.printerId)?.name || "-"}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center">
          <Checkbox
            checked={category.available}
            disabled={togglingId === category.id}
            onCheckedChange={() => handleToggle(category)}
          />
        </div>
      </TableCell>
      <TableCell className="w-10 text-right">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          className="p-1 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing touch-none"
          aria-label="Trascina per riordinare"
        >
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
    </TableRow>
  );
}

export function CategoriesTable({
  categories,
  printers,
  onEdit,
  onToggle,
  onReorder,
}: CategoriesTableProps) {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  async function handleToggle(category: Category) {
    setTogglingId(category.id);
    try {
      const updated = await toggleCategoryAvailability(
        category.id,
        !category.available
      );
      onToggle(updated);
      toast.success(
        `Category "${category.name}" ${updated.available ? "enabled" : "disabled"}
        }`
      );
    } catch (error) {
      toast.error("Error updating category");
    } finally {
      setTogglingId(null);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    const reordered = arrayMove(categories, oldIndex, newIndex).map(
      (cat, index) => ({
        ...cat,
        position: index,
      })
    );

    onReorder(reordered);
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">
          No categories found
        </p>
      </div>
    );
  }

  // Render simple table during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10" />
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="hidden md:table-cell font-medium">Printer</TableHead>
              <TableHead className="w-32 text-center font-medium">
                Available
              </TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="w-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(category)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {printers.find((p) => p.id === category.printerId)?.name || "-"}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={category.available}
                      disabled={togglingId === category.id}
                      onCheckedChange={() => handleToggle(category)}
                    />
                  </div>
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
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10" />
              <TableHead className="font-medium">Name</TableHead>
              <TableHead className="hidden md:table-cell font-medium">Printer</TableHead>
              <TableHead className="w-32 text-center font-medium">
                Available
              </TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <SortableContext
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {categories.map((category) => (
                <SortableRow
                  key={category.id}
                  category={category}
                  printers={printers}
                  togglingId={togglingId}
                  onEdit={onEdit}
                  handleToggle={handleToggle}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
        <DragOverlay>
          {activeCategory ? (
            <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-3 shadow-lg">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{activeCategory.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
