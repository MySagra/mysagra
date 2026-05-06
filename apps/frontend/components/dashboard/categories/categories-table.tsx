"use client";

import { useState, useEffect, useRef } from "react";
import { Category, Printer, Station } from "@/lib/api-types";
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
import { PencilIcon, GripVerticalIcon, ImageIcon } from "lucide-react";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
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
import { useLocale } from "@/contexts/locale-context";

function getCategoryImageUrl(filename: string) {
  return `/api/images/categories/${filename}`;
}

interface CategoriesTableProps {
  categories: Category[];
  printers: Printer[];
  stations: Station[];
  onEdit: (category: Category) => void;
  onToggle: (updated: Category) => void;
  onReorder: (reordered: Category[]) => void;
}

function ImageCell({ image, name }: { image?: string | null; name: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  if (!image) {
    return (
      <div className="h-8 w-12 rounded border bg-muted flex items-center justify-center">
        <ImageIcon className="h-3 w-3 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {!loaded && <ImageSkeleton width={48} height={32} className="rounded border" />}
      <img
        ref={imgRef}
        src={getCategoryImageUrl(image)}
        alt={name}
        className={`h-8 w-12 object-cover rounded border ${!loaded ? "hidden" : ""}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

function TableHeaders({ t }: { t: any }) {
  return (
    <TableRow className="bg-muted/50">
      <TableHead className="w-10" />
      <TableHead className="w-16 font-medium">{t.categories.columnImage}</TableHead>
      <TableHead className="font-medium">{t.categories.columnName}</TableHead>
      <TableHead className="hidden lg:table-cell font-medium">{t.categories.columnStation}</TableHead>
      <TableHead className="hidden md:table-cell font-medium">{t.categories.columnPrinter}</TableHead>
      <TableHead className="w-32 text-center font-medium">{t.categories.columnAvailable}</TableHead>
      <TableHead className="w-10 text-right" />
    </TableRow>
  );
}

function SortableRow({
  category,
  printers,
  stations,
  togglingId,
  onEdit,
  handleToggle,
  dragLabel,
}: {
  category: Category;
  printers: Printer[];
  stations: Station[];
  togglingId: string | null;
  onEdit: (category: Category) => void;
  handleToggle: (category: Category) => void;
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
        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      </TableCell>
      <TableCell className="w-16">
        <ImageCell image={category.image} name={category.name} />
      </TableCell>
      <TableCell className="font-medium max-w-48">
        <span className="block truncate" title={category.name}>{category.name}</span>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-muted-foreground">
        {stations.find((s) => s.id === category.stationId)?.name || "-"}
      </TableCell>
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
          aria-label={dragLabel}
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
  stations,
  onEdit,
  onToggle,
  onReorder,
}: CategoriesTableProps) {
  const { t } = useLocale();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleToggle(category: Category) {
    setTogglingId(category.id);
    try {
      const updated = await toggleCategoryAvailability(category.id, !category.available);
      onToggle(updated);
      toast.success(`"${category.name}" ${t.categories.toastUpdated}`);
    } catch {
      toast.error(t.categories.toastErrorUpdate);
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

    const reordered = arrayMove(categories, oldIndex, newIndex).map((cat, index) => ({
      ...cat,
      position: index,
    }));

    onReorder(reordered);
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.categories.noCategoriesFound}</p>
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
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="w-10">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="w-16">
                  <ImageCell image={category.image} name={category.name} />
                </TableCell>
                <TableCell className="font-medium max-w-48">
                  <span className="block truncate" title={category.name}>{category.name}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  {stations.find((s) => s.id === category.stationId)?.name || "-"}
                </TableCell>
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
        id="categories-dnd"
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
            items={categories.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {categories.map((category) => (
                <SortableRow
                  key={category.id}
                  category={category}
                  printers={printers}
                  stations={stations}
                  togglingId={togglingId}
                  onEdit={onEdit}
                  handleToggle={handleToggle}
                  dragLabel={t.categories.dragToReorder}
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
