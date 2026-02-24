"use client";

import { useState, useMemo, useEffect } from "react";
import { Ingredient } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PencilIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";

interface IngredientsTableProps {
  ingredients: Ingredient[];
  onEdit: (ingredient: Ingredient) => void;
}

type SortColumn = "name" | null;
type SortDirection = "asc" | "desc";

export function IngredientsTable({
  ingredients,
  onEdit,
}: IngredientsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    const savedColumn = localStorage.getItem("ingredients-table-sort-column");
    const savedDirection = localStorage.getItem("ingredients-table-sort-direction");
    if (savedColumn) {
      setSortColumn(savedColumn as SortColumn);
    }
    if (savedDirection) {
      setSortDirection(savedDirection as SortDirection);
    }
  }, []);

  useEffect(() => {
    if (sortColumn) {
      localStorage.setItem("ingredients-table-sort-column", sortColumn);
    } else {
      localStorage.removeItem("ingredients-table-sort-column");
    }
    localStorage.setItem("ingredients-table-sort-direction", sortDirection);
  }, [sortColumn, sortDirection]);

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortColumn(null);
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const sortedIngredients = useMemo(() => {
    if (!sortColumn) return ingredients;

    return [...ingredients].sort((a, b) => {
      const aValue = a.name.toLowerCase();
      const bValue = b.name.toLowerCase();

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [ingredients, sortColumn, sortDirection]);

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) {
      return <ArrowUpDownIcon className="h-4 w-4 ml-1 opacity-30" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUpIcon className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 ml-1" />
    );
  }

  if (sortedIngredients.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">
          No ingredients found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <button
                onClick={() => handleSort("name")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                Name
                <SortIcon column="name" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIngredients.map((ingredient) => (
            <TableRow key={ingredient.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(ingredient)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="font-medium">{ingredient.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
