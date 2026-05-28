import { Skeleton } from "@/components/ui/skeleton";
import { SettingsContentSkeleton } from "@/components/dashboard/settings/settings-content-skeleton";

export default function SettingsLoading() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <Skeleton className="h-5 w-5 rounded-md" />
        <Skeleton className="h-4 w-px mx-1" />
        <Skeleton className="h-4 w-28" />
      </header>
      <SettingsContentSkeleton />
    </>
  );
}
