"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon, SaveIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";

interface BannersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
  onSaveOrder: () => void;
  onResetOrder: () => void;
  hasOrderChanged: boolean;
  isSavingOrder: boolean;
  canCreate?: boolean;
}

export function BannersToolbar({
  searchQuery,
  onSearchChange,
  onCreateNew,
  onSaveOrder,
  onResetOrder,
  hasOrderChanged,
  isSavingOrder,
  canCreate = true,
}: BannersToolbarProps) {
  const { t } = useLocale();
  const { isSessionLoading } = useRole();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.banners.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        {hasOrderChanged && (
          <>
            <Button
              variant="outline"
              onClick={onResetOrder}
              disabled={isSavingOrder}
            >
              <RotateCcwIcon className="h-4 w-4 mr-2" />
              {t.banners.resetOrder}
            </Button>
            <Button
              variant="outline"
              onClick={onSaveOrder}
              disabled={isSavingOrder}
            >
              {isSavingOrder ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2" />
              )}
              {t.banners.saveOrder}
            </Button>
          </>
        )}
        {isSessionLoading
          ? <Skeleton className="h-9 w-36 rounded-md" />
          : canCreate && (
              <Button onClick={onCreateNew}>
                <PlusIcon className="h-4 w-4 mr-2" />
                {t.banners.newBanner}
              </Button>
            )
        }
      </div>
    </div>
  );
}
