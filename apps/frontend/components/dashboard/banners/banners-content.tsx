"use client";

import { useState, useMemo } from "react";
import { Banner } from "@/lib/api-types";
import { BannersToolbar } from "./banners-toolbar";
import { BannersTable } from "./banners-table";
import { BannerDialog } from "./banner-dialog";
import { DeleteBannerDialog } from "./delete-banner-dialog";
import { useRole } from "@/hooks/use-role";
import { reorderBanners } from "@/actions/banners";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";

interface BannersContentProps {
  initialBanners: Banner[];
}

export function BannersContent({ initialBanners }: BannersContentProps) {
  const { canManageBanners } = useRole();
  const { t } = useLocale();
  const [banners, setBanners] = useState<Banner[]>(
    [...initialBanners].sort((a, b) => a.position - b.position)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const filteredBanners = useMemo(() => {
    if (!searchQuery) return banners;
    const q = searchQuery.toLowerCase();
    return banners.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.title?.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q)
    );
  }, [banners, searchQuery]);

  function handleCreate() {
    setEditingBanner(null);
    setDialogOpen(true);
  }

  function handleEdit(banner: Banner) {
    setEditingBanner(banner);
    setDialogOpen(true);
  }

  function handleDelete(banner: Banner) {
    setDeletingBanner(banner);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Banner) {
    if (editingBanner) {
      setBanners((prev) => prev.map((b) => (b.id === saved.id ? saved : b)));
    } else {
      setBanners((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingBanner(null);
  }

  function handleDeleted(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    setDeleteDialogOpen(false);
    setDeletingBanner(null);
  }

  function handleReorder(reordered: Banner[]) {
    setBanners(reordered);
    const hasChanged = reordered.some((b, index) => {
      const original = initialBanners.find((o) => o.id === b.id);
      return original && original.position !== index;
    });
    setHasOrderChanged(hasChanged);
  }

  async function handleSaveOrder() {
    setIsSavingOrder(true);
    try {
      await reorderBanners(
        banners.map((b, index) => ({
          id: b.id,
          label: b.label,
          type: b.type,
          position: index,
          title: b.title,
          description: b.description,
          website: b.website,
          facebook: b.facebook,
          instagram: b.instagram,
          telephone: b.telephone,
          color: b.color,
          startsAt: b.startsAt ? new Date(b.startsAt).toISOString() : null,
          endsAt: b.endsAt ? new Date(b.endsAt).toISOString() : null,
          visibleFrom: new Date(b.visibleFrom).toISOString(),
        }))
      );
      setHasOrderChanged(false);
      toast.success(t.banners.toastOrderSaved);
    } catch {
      toast.error(t.banners.toastErrorReorder);
    } finally {
      setIsSavingOrder(false);
    }
  }

  function handleResetOrder() {
    setBanners([...initialBanners].sort((a, b) => a.position - b.position));
    setHasOrderChanged(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <BannersToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
          onSaveOrder={handleSaveOrder}
          onResetOrder={handleResetOrder}
          hasOrderChanged={hasOrderChanged}
          isSavingOrder={isSavingOrder}
          canCreate={canManageBanners}
        />
        <BannersTable
          banners={filteredBanners}
          onEdit={handleEdit}
          onReorder={handleReorder}
        />
        <BannerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          banner={editingBanner}
          nextPosition={banners.length}
          onSaved={handleSaved}
          onDelete={canManageBanners ? handleDelete : undefined}
        />
        <DeleteBannerDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          banner={deletingBanner}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  );
}
