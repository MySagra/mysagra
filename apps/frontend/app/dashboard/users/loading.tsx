import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        {/* Toolbar: search + new user */}
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-32 shrink-0" />
        </div>

        {/* Table — matches UsersTable: Username | Ruolo | actions */}
        <div className="rounded-md border overflow-hidden">
          {/* Header */}
          <div className="flex items-center border-b bg-muted/50 px-4 py-3">
            <Skeleton className="h-4 w-24" />
            {/* Ruolo label, aligned over the select/actions group */}
            <div className="ml-auto w-58">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Rows */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b last:border-0 px-4 py-3"
            >
              {/* Username */}
              <Skeleton className="h-4 w-32" />
              {/* Role select + actions, pinned right */}
              <div className="ml-auto flex items-center gap-2">
                <Skeleton className="h-9 w-36 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
