"use client";

import { useState, useMemo, useEffect } from "react";
import { User } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
}

type SortColumn = "username" | "role" | null;
type SortDirection = "asc" | "desc";

export function UsersTable({ users, onEdit }: UsersTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    const savedColumn = localStorage.getItem("users-table-sort-column");
    const savedDirection = localStorage.getItem("users-table-sort-direction");
    if (savedColumn) {
      setSortColumn(savedColumn as SortColumn);
    }
    if (savedDirection) {
      setSortDirection(savedDirection as SortDirection);
    }
  }, []);

  useEffect(() => {
    if (sortColumn) {
      localStorage.setItem("users-table-sort-column", sortColumn);
    } else {
      localStorage.removeItem("users-table-sort-column");
    }
    localStorage.setItem("users-table-sort-direction", sortDirection);
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

  const sortedUsers = useMemo(() => {
    if (!sortColumn) return users;

    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "username":
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case "role":
          aValue = a.role.name.toLowerCase();
          bValue = b.role.name.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, sortColumn, sortDirection]);

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

  if (sortedUsers.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">No users found</p>
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
                onClick={() => handleSort("username")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                Username
                <SortIcon column="username" />
              </button>
            </TableHead>
            <TableHead className="w-40">
              <button
                onClick={() => handleSort("role")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                Role
                <SortIcon column="role" />
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(user)}
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </TableCell>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>
                <Badge variant="secondary">{user.role.name}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
