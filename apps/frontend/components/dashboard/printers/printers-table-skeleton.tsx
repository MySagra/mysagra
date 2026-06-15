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

export function PrintersTableSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12" />
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead className="w-36 hidden md:table-cell"><Skeleton className="h-4 w-8" /></TableHead>
              <TableHead className="w-40 hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead className="w-20 hidden md:table-cell"><Skeleton className="h-4 w-10 mx-auto" /></TableHead>
              <TableHead className="w-48 hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="w-36"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell />
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden md:table-cell text-center"><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="text-center"><Skeleton className="h-8 w-28 mx-auto rounded-md" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
