"use client";

import { useState, useEffect, useRef } from "react";
import { Banner } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, ImageIcon, GripVerticalIcon } from "lucide-react";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import { useLocale } from "@/contexts/locale-context";
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
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";

function getBannerImageUrl(filename: string) {
  return `/api/images/banners/${filename}`;
}

interface BannersTableProps {
  banners: Banner[];
  onEdit: (banner: Banner) => void;
  onReorder: (reordered: Banner[]) => void;
}

function BannerImageCell({ image, label }: { image?: string | null; label: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  if (!image) {
    return (
      <div className="h-10 w-14 rounded-md border bg-muted flex items-center justify-center">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {!loaded && <ImageSkeleton width={56} height={40} className="rounded-md border" />}
      <img
        ref={imgRef}
        src={getBannerImageUrl(image)}
        alt={label}
        className={`h-10 w-14 object-cover rounded-md border ${!loaded ? "hidden" : ""}`}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

function TableHeaders({ t }: { t: any }) {
  return (
    <TableRow className="bg-muted/50">
      <TableHead className="w-10" />
      <TableHead className="w-16 font-medium">{t.banners.columnImage}</TableHead>
      <TableHead className="font-medium">{t.banners.columnLabel}</TableHead>
      <TableHead className="font-medium w-28">{t.banners.columnType}</TableHead>
      <TableHead className="hidden md:table-cell font-medium">{t.banners.columnTitle}</TableHead>
      <TableHead className="w-10 text-right" />
    </TableRow>
  );
}

function SortableRow({
  banner,
  onEdit,
  dragLabel,
  isReadOnly,
  isSessionLoading,
}: {
  banner: Banner;
  onEdit: (banner: Banner) => void;
  dragLabel: string;
  isReadOnly: boolean;
  isSessionLoading: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

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
              <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
                <PencilIcon className="h-4 w-4" />
              </Button>
            )
        }
      </TableCell>
      <TableCell className="w-16">
        <BannerImageCell image={banner.image} label={banner.label} />
      </TableCell>
      <TableCell className="font-medium max-w-48">
        <span className="block truncate" title={banner.label}>{banner.label}</span>
      </TableCell>
      <TableCell className="w-28">
        <Badge variant={banner.type === "EVENT" ? "default" : "secondary"}>
          {banner.type}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground max-w-64">
        <span className="block truncate" title={banner.title ?? undefined}>
          {banner.title ?? "-"}
        </span>
      </TableCell>
      <TableCell className="w-10 text-right">
        {isSessionLoading
          ? <Skeleton className="h-6 w-4 rounded-md mx-auto" />
          : !isReadOnly && (
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

export function BannersTable({ banners, onEdit, onReorder }: BannersTableProps) {
  const { t } = useLocale();
  const { isReadOnly, isSessionLoading } = useRole();
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeBanner = banners.find((b) => b.id === activeId) ?? null;

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

    const oldIndex = banners.findIndex((b) => b.id === active.id);
    const newIndex = banners.findIndex((b) => b.id === over.id);

    const reordered = arrayMove(banners, oldIndex, newIndex).map((b, index) => ({
      ...b,
      position: index,
    }));

    onReorder(reordered);
  }

  if (banners.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.banners.noBannersFound}</p>
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
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell className="w-10">
                  {isSessionLoading
                    ? <Skeleton className="h-8 w-8 rounded-md" />
                    : !isReadOnly && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )
                  }
                </TableCell>
                <TableCell className="w-16">
                  <BannerImageCell image={banner.image} label={banner.label} />
                </TableCell>
                <TableCell className="font-medium max-w-48">
                  <span className="block truncate" title={banner.label}>{banner.label}</span>
                </TableCell>
                <TableCell className="w-28">
                  <Badge variant={banner.type === "EVENT" ? "default" : "secondary"}>
                    {banner.type}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground max-w-64">
                  <span className="block truncate" title={banner.title ?? undefined}>
                    {banner.title ?? "-"}
                  </span>
                </TableCell>
                <TableCell className="w-10 text-right">
                  {isSessionLoading
                    ? <Skeleton className="h-6 w-4 rounded-md mx-auto" />
                    : !isReadOnly && (
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
        id="banners-dnd"
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
            items={banners.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <TableBody>
              {banners.map((banner) => (
                <SortableRow
                  key={banner.id}
                  banner={banner}
                  onEdit={onEdit}
                  dragLabel={t.banners.dragToReorder}
                  isReadOnly={isReadOnly}
                  isSessionLoading={isSessionLoading}
                />
              ))}
            </TableBody>
          </SortableContext>
        </Table>
        <DragOverlay>
          {activeBanner ? (
            <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-3 shadow-lg">
              <GripVerticalIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{activeBanner.label}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
