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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
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

  function handleDragEnd(event: DragEndEvent) {
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
      <div className="rounded-xl border">
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
    <div className="rounded-xl border overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
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
      </DndContext>
    </div>
  );
}
