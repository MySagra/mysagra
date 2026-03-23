import { Skeleton } from "@/components/ui/skeleton"

export function DashboardPageSkeleton() {
  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <Skeleton className="h-7 w-7 rounded-md" />
          <div className="w-px h-4 bg-border mx-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-60" />
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-9 w-32 ml-auto" />
          </div>

          {/* Table */}
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
    </>
  )
}
