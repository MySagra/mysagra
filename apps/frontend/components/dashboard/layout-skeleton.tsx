import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export function DashboardLayoutSkeleton() {
  return (
    <SidebarProvider>
      {/* Sidebar Skeleton */}
      <div className="flex h-screen w-64 flex-col border-r bg-background">
        {/* Sidebar Header */}
        <div className="border-b p-4">
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <SidebarInset>
        <div className="flex flex-col h-screen">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center gap-2 ml-auto">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </header>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-4 p-4 overflow-y-auto">
            <div className="max-w-7xl mx-auto w-full space-y-4">
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
