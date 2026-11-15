"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Category, Food, Printer, Station } from "@/lib/api-types";
import { setCategorySeparateTicket, toggleCategoryAvailability } from "@/actions/categories";
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
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";
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
  foods: Food[];
  printers: Printer[];
  stations: Station[];
  onEdit: (category: Category) => void;
  onToggle: (updated: Category) => void;
  onFoodsUpdated: (categoryId: string, foods: Food[]) => void;
  onReorder: (activeId: string, overId: string) => void;
  isReorderDisabled?: boolean;
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

// The flag lives on the foods: all of them set, none, or only some ("indeterminate").
// null when the category has no foods, so there is nothing to set.
type SeparateTicketState = boolean | "indeterminate" | null;

function separateTicketStates(foods: Food[]): Map<string, SeparateTicketState> {
  const counts = new Map<string, { total: number; separate: number }>();
  for (const food of foods) {
    const count = counts.get(food.categoryId) ?? { total: 0, separate: 0 };
    count.total++;
    if (food.separateTicket) count.separate++;
    counts.set(food.categoryId, count);
  }

  const states = new Map<string, SeparateTicketState>();
  for (const [categoryId, { total, separate }] of counts) {
    states.set(categoryId, separate === 0 ? false : separate === total ? true : "indeterminate");
  }
  return states;
}

function SeparateTicketCell({
  state,
  disabled,
  title,
  onChange,
}: {
  state: SeparateTicketState;
  disabled: boolean;
  title: string;
  onChange: (separateTicket: boolean) => void;
}) {
  return (
    <TableCell className="hidden sm:table-cell text-center">
      <div className="flex justify-center" title={title}>
        <Checkbox
          checked={state ?? false}
          disabled={disabled || state === null}
          // a partial category becomes fully set
          onCheckedChange={() => onChange(state !== true)}
        />
      </div>
    </TableCell>
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
      <TableHead className="hidden sm:table-cell w-32 text-center font-medium" title={t.categories.separateTicketHint}>
        {t.categories.columnSeparateTicket}
      </TableHead>
      <TableHead className="w-10 text-right" />
    </TableRow>
  );
}

function SortableRow({
  category,
  printers,
  stations,
  togglingId,
  separateTicket,
  separateTicketTitle,
  onEdit,
  handleToggle,
  handleSeparateTicket,
  dragLabel,
  isReadOnly,
  isSessionLoading,
  isReorderDisabled,
}: {
  category: Category;
  printers: Printer[];
  stations: Station[];
  togglingId: string | null;
  separateTicket: SeparateTicketState;
  separateTicketTitle: string;
  onEdit: (category: Category) => void;
  handleToggle: (category: Category) => void;
  handleSeparateTicket: (category: Category, separateTicket: boolean) => void;
  dragLabel: string;
  isReadOnly: boolean;
  isSessionLoading: boolean;
  isReorderDisabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled: isReorderDisabled });

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
        {isSessionLoading
          ? <Skeleton className="h-8 w-8 rounded-md" />
          : !isReadOnly && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                <PencilIcon className="h-4 w-4" />
              </Button>
            )
        }
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
            disabled={isReadOnly || togglingId === category.id}
            onCheckedChange={() => !isReadOnly && handleToggle(category)}
          />
        </div>
      </TableCell>
      <SeparateTicketCell
        state={separateTicket}
        disabled={isReadOnly || togglingId === category.id}
        title={separateTicketTitle}
        onChange={(value) => !isReadOnly && handleSeparateTicket(category, value)}
      />
      <TableCell className="w-10 text-right">
        {isSessionLoading
          ? <Skeleton className="h-6 w-4 rounded-md mx-auto" />
          : !isReadOnly && !isReorderDisabled && (
              <button
                ref={setActivatorNodeRef}
                {...attributes}
                {...listeners}
                className="p-1 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing touch-none"
                aria-label={dragLabel}
              >
                <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
              </button>
            )
        }
      </TableCell>
    </TableRow>
  );
}

export function CategoriesTable({
  categories,
  foods,
  printers,
  stations,
  onEdit,
  onToggle,
  onFoodsUpdated,
  onReorder,
  isReorderDisabled = false,
}: CategoriesTableProps) {
  const { t } = useLocale();
  const { isReadOnly, isSessionLoading } = useRole();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCategory = categories.find((c) => c.id === activeId) ?? null;
  const separateTickets = useMemo(() => separateTicketStates(foods), [foods]);

  function separateTicketTitle(categoryId: string) {
    const state = separateTickets.get(categoryId) ?? null;
    if (state === null) return t.categories.separateTicketNoFoods;
    if (state === "indeterminate") return t.categories.separateTicketPartial;
    return t.categories.separateTicketHint;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  async function handleToggle(category: Category) {
    setTogglingId(category.id);
    const result = await toggleCategoryAvailability(category.id, !category.available);
    if (result.ok) {
      onToggle(result.data);
      toast.success(`"${category.name}" ${t.categories.toastUpdated}`);
    } else {
      toast.error(result.error || t.categories.toastErrorUpdate);
    }
    setTogglingId(null);
  }

  async function handleSeparateTicket(category: Category, separateTicket: boolean) {
    setTogglingId(category.id);
    const result = await setCategorySeparateTicket(category.id, separateTicket);
    if (result.ok) {
      onFoodsUpdated(category.id, result.data);
      toast.success(`"${category.name}" ${t.categories.toastUpdated}`);
    } else {
      toast.error(result.error || t.categories.toastErrorUpdate);
    }
    setTogglingId(null);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    onReorder(active.id as string, over.id as string);
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
                  {isSessionLoading
                    ? <Skeleton className="h-8 w-8 rounded-md" />
                    : !isReadOnly && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )
                  }
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
                      disabled={isReadOnly || togglingId === category.id}
                      onCheckedChange={() => !isReadOnly && handleToggle(category)}
                    />
                  </div>
                </TableCell>
                <SeparateTicketCell
                  state={separateTickets.get(category.id) ?? null}
                  disabled={isReadOnly || togglingId === category.id}
                  title={separateTicketTitle(category.id)}
                  onChange={(value) => !isReadOnly && handleSeparateTicket(category, value)}
                />
                <TableCell className="w-10 text-right">
                  {isSessionLoading
                    ? <Skeleton className="h-6 w-4 rounded-md mx-auto" />
                    : !isReadOnly && !isReorderDisabled && (
                        <div className="p-1">
                          <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )
                  }
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
                  separateTicket={separateTickets.get(category.id) ?? null}
                  separateTicketTitle={separateTicketTitle(category.id)}
                  onEdit={onEdit}
                  handleToggle={handleToggle}
                  handleSeparateTicket={handleSeparateTicket}
                  dragLabel={t.categories.dragToReorder}
                  isReadOnly={isReadOnly}
                  isSessionLoading={isSessionLoading}
                  isReorderDisabled={isReorderDisabled}
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
