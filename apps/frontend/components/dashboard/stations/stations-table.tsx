"use client";

import { Station } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

interface StationsTableProps {
  stations: Station[];
  onEdit: (station: Station) => void;
}

function TableHeaders({ t }: { t: any }) {
  return (
    <TableRow className="bg-muted/50">
      <TableHead className="w-10" />
      <TableHead className="font-medium">{t.stations.columnName}</TableHead>
      <TableHead className="hidden md:table-cell text-center font-medium">{t.stations.columnCategories}</TableHead>
      <TableHead className="w-10 text-right" />
    </TableRow>
  );
}

export function StationsTable({ stations, onEdit }: StationsTableProps) {
  const { t } = useLocale();

  if (stations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.stations.noStationsFound}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableHeaders t={t} />
        </TableHeader>
        <TableBody>
          {stations.map((station) => (
            <TableRow key={station.id}>
              <TableCell className="w-10">
                <Button variant="ghost" size="icon" onClick={() => onEdit(station)}>
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="font-medium max-w-48">
                <span className="block truncate" title={station.name}>
                  {station.name}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell text-center text-muted-foreground">
                {station.categories?.length ?? 0}
              </TableCell>
              <TableCell className="w-10 text-right" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
