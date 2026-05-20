"use client";

import { useState, useMemo } from "react";
import { Station } from "@/lib/api-types";
import { deleteStation } from "@/actions/stations";
import { StationsToolbar } from "./stations-toolbar";
import { StationsTable } from "./stations-table";
import { StationDialog } from "./stations-dialog";
import { DeleteStationDialog } from "./delete-station-dialog";
import { toast } from "sonner";
import { useRole } from "@/hooks/use-role";

interface StationsContentProps {
  initialStations: Station[];
}

export function StationsContent({ initialStations }: StationsContentProps) {
  const { canManageCategories } = useRole();
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStation, setDeletingStation] = useState<Station | null>(null);

  const filteredStations = useMemo(() => {
    if (!searchQuery) return stations;
    return stations.filter((station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [stations, searchQuery]);

  function handleCreate() {
    setEditingStation(null);
    setDialogOpen(true);
  }

  function handleEdit(station: Station) {
    setEditingStation(station);
    setDialogOpen(true);
  }

  function handleDelete(station: Station) {
    setDeletingStation(station);
    setDeleteDialogOpen(true);
  }

  function handleSaved(saved: Station) {
    if (editingStation) {
      setStations((prev) =>
        prev.map((s) => (s.id === saved.id ? saved : s))
      );
    } else {
      setStations((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingStation(null);
  }

  function handleDeleted(id: string) {
    setStations((prev) => prev.filter((s) => s.id !== id));
    setDeleteDialogOpen(false);
    setDeletingStation(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <StationsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
          canCreate={canManageCategories}
        />
        <StationsTable
          stations={filteredStations}
          onEdit={handleEdit}
        />
        <StationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          station={editingStation}
          onSaved={handleSaved}
          onDelete={canManageCategories ? handleDelete : undefined}
        />
        <DeleteStationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          station={deletingStation}
          onDeleted={handleDeleted}
        />
      </div>
    </div>
  );
}
