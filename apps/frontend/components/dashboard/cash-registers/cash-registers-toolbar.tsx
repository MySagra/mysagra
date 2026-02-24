"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon, SearchIcon } from "lucide-react";

interface CashRegistersToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
}

export function CashRegistersToolbar({
  searchQuery,
  onSearchChange,
  onCreateNew,
}: CashRegistersToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="relative flex-1 max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cash registers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button onClick={onCreateNew}>
        <PlusIcon className="h-4 w-4 mr-2" />
        New Register
      </Button>
    </div>
  );
}
