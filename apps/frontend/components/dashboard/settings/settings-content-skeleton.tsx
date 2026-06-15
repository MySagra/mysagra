import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function SettingsContentSkeleton() {
  return (
    <div className="flex flex-1 flex-col md:flex-row gap-0 p-4 pt-0 min-h-0">

      {/* Nav — horizontal on mobile, vertical on desktop */}
      <nav className="md:w-48 shrink-0 md:pr-4">
        {/* Mobile: horizontal pills */}
        <div className="flex md:hidden gap-1 mb-4 rounded-lg bg-muted p-1">
          <Skeleton className="flex-1 h-7 rounded-md" />
          <Skeleton className="flex-1 h-7 rounded-md" />
        </div>

        {/* Desktop: vertical list */}
        <ul className="hidden md:flex flex-col space-y-1">
          <li><Skeleton className="h-10 w-full rounded-lg" /></li>
          <li><Skeleton className="h-10 w-full rounded-lg" /></li>
        </ul>
      </nav>

      <Separator orientation="vertical" className="hidden md:block self-stretch" />
      <Separator className="md:hidden mb-4" />

      {/* Form content */}
      <div className="flex-1 md:pl-6 min-w-0">
        <div className="w-full flex justify-center">
          <div className="w-full max-w-xl space-y-6">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Username card */}
            <div>
              <div className="rounded-xl border bg-card">
                <div className="px-5 py-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
              <Skeleton className="h-11 w-full mt-3 rounded-md" />
            </div>

            {/* Password card */}
            <div>
              <div className="rounded-xl border bg-card divide-y">
                <div className="px-5 py-4 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="px-5 py-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
              <Skeleton className="h-11 w-full mt-3 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
