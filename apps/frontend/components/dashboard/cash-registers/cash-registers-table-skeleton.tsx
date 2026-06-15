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

export function CashRegistersTableSkeleton() {
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
              <TableHead className="w-48"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="w-32"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell />
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                <TableCell className="text-center">
                  <Skeleton className="h-4 w-4 mx-auto rounded-sm" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
