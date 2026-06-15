"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";

interface IngredientsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
}

export function IngredientsToolbar({
  searchQuery,
  onSearchChange,
  onCreateNew,
}: IngredientsToolbarProps) {
  const { t } = useLocale();
  const { isReadOnly, isSessionLoading } = useRole();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.ingredients.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      {isSessionLoading
        ? <Skeleton className="h-9 w-36 rounded-md" />
        : !isReadOnly && (
            <Button onClick={onCreateNew}>
              <PlusIcon className="h-4 w-4 mr-2" />
              {t.ingredients.newIngredient}
            </Button>
          )
      }
    </div>
  );
}
