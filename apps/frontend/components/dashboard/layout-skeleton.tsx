import { Skeleton } from "@/components/ui/skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Placeholder for DashboardHeader height */}
      <div className="h-16 shrink-0 border-b" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-60" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-32 ml-auto" />
          </div>
          <div className="rounded-md border overflow-hidden">
            <div className="flex items-center gap-6 border-b px-4 py-3 bg-muted/30">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 border-b last:border-0 px-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
