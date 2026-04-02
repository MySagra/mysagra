"use client";

import { useState, useMemo } from "react";
import { Banner } from "@/lib/api-types";
import { BannersToolbar } from "./banners-toolbar";
import { BannersTable } from "./banners-table";
import { BannerDialog } from "./banner-dialog";
import { DeleteBannerDialog } from "./delete-banner-dialog";
import { useRole } from "@/hooks/use-role";

interface BannersContentProps {
  initialBanners: Banner[];
}

export function BannersContent({ initialBanners }: BannersContentProps) {
  const { canManageBanners } = useRole();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);

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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <BannersToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
          canCreate={canManageBanners}
        />
        <BannersTable
          banners={filteredBanners}
          onEdit={handleEdit}
        />
        <BannerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          banner={editingBanner}
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
