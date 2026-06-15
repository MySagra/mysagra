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

export function CategoriesTableSkeleton() {
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
              <TableHead className="w-16"><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="w-32 text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell />
                <TableCell><Skeleton className="h-8 w-12 rounded" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto rounded-sm" />
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
