import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleBadgeClass: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800",
  maintainer: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  operator: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
};

// Role badge shared by the user menu and the users list: the role name, colored per role
export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("w-fit px-1.5 py-0 text-[10px] font-medium capitalize leading-4", roleBadgeClass[role], className)}
    >
      {role}
    </Badge>
  );
}
