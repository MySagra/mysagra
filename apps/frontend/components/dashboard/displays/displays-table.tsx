"use client";

import { Display, DisplayView, Station } from "@/lib/api-types";
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
import { PencilIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";
import { Translations } from "@/lib/i18n";

interface DisplaysTableProps {
  displays: Display[];
  stations: Station[];
  onEdit: (display: Display) => void;
}

export function viewLabel(t: Translations, view: DisplayView) {
  return {
    READY: t.displays.viewReady,
    PREPARING: t.displays.viewPreparing,
    HYBRID: t.displays.viewHybrid,
  }[view];
}

export function DisplaysTable({ displays, stations, onEdit }: DisplaysTableProps) {
  const { t } = useLocale();
  const { canEditDisplays } = useRole();

  const stationNames = new Map(stations.map((station) => [station.id, station.name]));

  if (displays.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.displays.noDisplaysFound}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-10" />
            <TableHead className="font-medium">{t.displays.columnName}</TableHead>
            <TableHead className="font-medium">{t.displays.columnView}</TableHead>
            <TableHead className="hidden md:table-cell font-medium">{t.displays.columnStations}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displays.map((display) => (
            <TableRow key={display.id}>
              <TableCell className="w-10">
                {canEditDisplays && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(display)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell className="max-w-48">
                <span className="block truncate font-medium" title={display.name}>
                  {display.name}
                </span>
                {display.description && (
                  <span className="block truncate text-xs text-muted-foreground" title={display.description}>
                    {display.description}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{viewLabel(t, display.view)}</Badge>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {display.stationIds.length > 0
                  ? display.stationIds.map((id) => stationNames.get(id) ?? id).join(", ")
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
