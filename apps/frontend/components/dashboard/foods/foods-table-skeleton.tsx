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

export function FoodsTableSkeleton() {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-9 flex-1 max-w-sm rounded-md" />
          <Skeleton className="h-9 w-48 rounded-md" />
        </div>
      </div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12" />
              <TableHead><Skeleton className="h-4 w-12" /></TableHead>
              <TableHead className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableHead>
              <TableHead className="hidden md:table-cell w-28"><Skeleton className="h-4 w-14 ml-auto" /></TableHead>
              <TableHead className="hidden md:table-cell w-32"><Skeleton className="h-4 w-20" /></TableHead>
              <TableHead className="w-32"><Skeleton className="h-4 w-20 mx-auto" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell />
                <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-5 w-20 ml-auto rounded-full" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-16 ml-auto" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
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
