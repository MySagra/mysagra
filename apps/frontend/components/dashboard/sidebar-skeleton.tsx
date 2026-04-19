import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
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
  );
}
