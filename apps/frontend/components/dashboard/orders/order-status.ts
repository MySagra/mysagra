import { CircleCheck, Clock, GitMerge, PackageCheck, ShoppingBag, XIcon, type LucideIcon } from "lucide-react";

// Shared status palette for order cards, detail dialog and filters
export const statusConfig: Record<string, { icon: LucideIcon; colorClass: string; bgClass: string }> = {
  PENDING:   { icon: Clock,        colorClass: "text-yellow-600 dark:text-yellow-400", bgClass: "bg-yellow-500/10 border-yellow-500/30" },
  CONFIRMED: { icon: CircleCheck,  colorClass: "text-primary",                         bgClass: "bg-primary/10 border-primary/30" },
  COMPLETED: { icon: PackageCheck, colorClass: "text-green-600 dark:text-green-400",   bgClass: "bg-green-500/10 border-green-500/30" },
  PICKED_UP: { icon: ShoppingBag,  colorClass: "text-green-700 dark:text-green-500",   bgClass: "bg-green-600/10 border-green-600/30" },
  CANCELLED: { icon: XIcon,        colorClass: "text-destructive",                     bgClass: "bg-destructive/10 border-destructive/30" },
  PARTIAL:   { icon: GitMerge,     colorClass: "text-orange-600 dark:text-orange-400", bgClass: "bg-orange-500/10 border-orange-500/30" },
};
