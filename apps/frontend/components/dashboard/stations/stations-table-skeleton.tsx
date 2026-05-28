"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function StationsTableSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-10" />
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead className="hidden md:table-cell text-center">
                <Skeleton className="h-4 w-20 mx-auto" />
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell />
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell className="hidden md:table-cell text-center">
                  <Skeleton className="h-4 w-6 mx-auto" />
                </TableCell>
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
