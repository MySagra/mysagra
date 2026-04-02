"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

interface BannersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
  canCreate?: boolean;
}

export function BannersToolbar({
  searchQuery,
  onSearchChange,
  onCreateNew,
  canCreate = true,
}: BannersToolbarProps) {
  const { t } = useLocale();

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
      {canCreate && (
        <Button onClick={onCreateNew}>
          <PlusIcon className="h-4 w-4 mr-2" />
          {t.banners.newBanner}
        </Button>
      )}
    </div>
  );
}
