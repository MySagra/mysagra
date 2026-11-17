"use client";

import { useState, useMemo } from "react";
import { Display, Station } from "@/lib/api-types";
import { DisplaysToolbar } from "./displays-toolbar";
import { DisplaysTable } from "./displays-table";
import { DisplayDialog } from "./display-dialog";
import { DeleteDisplayDialog } from "./delete-display-dialog";
import { useRole } from "@/hooks/use-role";
import { StationsTableSkeleton } from "@/components/dashboard/stations/stations-table-skeleton";

interface DisplaysContentProps {
  initialDisplays: Display[];
  stations: Station[];
}

export function DisplaysContent({ initialDisplays, stations }: DisplaysContentProps) {
  const { canCreateDisplays, canDelete, isSessionLoading } = useRole();
  const [displays, setDisplays] = useState<Display[]>(initialDisplays);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDisplay, setEditingDisplay] = useState<Display | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDisplay, setDeletingDisplay] = useState<Display | null>(null);

  const filteredDisplays = useMemo(() => {
    if (!searchQuery) return displays;
    return displays.filter((display) =>
      display.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [displays, searchQuery]);

  function handleCreate() {
    setEditingDisplay(null);
    setDialogOpen(true);
  }

  function handleEdit(display: Display) {
    setEditingDisplay(display);
    setDialogOpen(true);
  }

  function handleDelete(display: Display) {
    setDeletingDisplay(display);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Display) {
    if (editingDisplay) {
      setDisplays((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
    } else {
      setDisplays((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingDisplay(null);
  }

  function handleDeleted(id: string) {
    setDisplays((prev) => prev.filter((d) => d.id !== id));
    setDeleteDialogOpen(false);
    setDeletingDisplay(null);
  }

  if (isSessionLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <StationsTableSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <DisplaysToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
          canCreate={canCreateDisplays}
        />
        <DisplaysTable
          displays={filteredDisplays}
          stations={stations}
          onEdit={handleEdit}
        />
        <DisplayDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          display={editingDisplay}
          displays={displays}
          stations={stations}
          onSaved={handleSaved}
          onDelete={canDelete ? handleDelete : undefined}
        />
        <DeleteDisplayDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          display={deletingDisplay}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  );
}
