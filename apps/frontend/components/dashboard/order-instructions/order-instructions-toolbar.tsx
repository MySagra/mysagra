"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon, SaveIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

interface OrderInstructionsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
  onSaveOrder: () => void;
  onResetOrder: () => void;
  hasOrderChanged: boolean;
  isSavingOrder: boolean;
  canCreate?: boolean;
}

export function OrderInstructionsToolbar({
  searchQuery,
  onSearchChange,
  onCreateNew,
  onSaveOrder,
  onResetOrder,
  hasOrderChanged,
  isSavingOrder,
  canCreate = true,
}: OrderInstructionsToolbarProps) {
  const { t } = useLocale();

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.orderInstructions.searchPlaceholder}
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
              {t.orderInstructions.resetOrder}
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
              {t.orderInstructions.saveOrder}
            </Button>
          </>
        )}
        {canCreate && (
          <Button onClick={onCreateNew}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t.orderInstructions.newInstruction}
          </Button>
        )}
      </div>
    </div>
  );
}
