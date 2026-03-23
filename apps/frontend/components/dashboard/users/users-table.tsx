"use client";

import { useState, useMemo, useEffect } from "react";
import { User, Role } from "@/lib/api-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2Icon, ArrowUpIcon, ArrowDownIcon, ArrowUpDownIcon } from "lucide-react";
import { useLocale } from "@/contexts/locale-context";

interface UsersTableProps {
  users: User[];
  roles: Role[];
  onRoleChange: (user: User, roleId: string) => void;
  onDelete: (user: User) => void;
  updatingId: string | null;
}

type SortColumn = "username" | "role" | null;
type SortDirection = "asc" | "desc";

export function UsersTable({ users, roles, onRoleChange, onDelete, updatingId }: UsersTableProps) {
  const { t } = useLocale();
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    const savedColumn = localStorage.getItem("users-table-sort-column");
    const savedDirection = localStorage.getItem("users-table-sort-direction");
    if (savedColumn) setSortColumn(savedColumn as SortColumn);
    if (savedDirection) setSortDirection(savedDirection as SortDirection);
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
      const aValue = sortColumn === "username"
        ? a.username.toLowerCase()
        : (a.role?.name ?? "").toLowerCase();
      const bValue = sortColumn === "username"
        ? b.username.toLowerCase()
        : (b.role?.name ?? "").toLowerCase();
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, sortColumn, sortDirection]);

  function SortIcon({ column }: { column: SortColumn }) {
    if (sortColumn !== column) return <ArrowUpDownIcon className="h-4 w-4 ml-1 opacity-30" />;
    return sortDirection === "asc"
      ? <ArrowUpIcon className="h-4 w-4 ml-1" />
      : <ArrowDownIcon className="h-4 w-4 ml-1" />;
  }

  if (sortedUsers.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed p-8">
        <p className="text-muted-foreground text-sm">{t.users.noUsersFound}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>
              <button
                onClick={() => handleSort("username")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                {t.users.columnUsername}
                <SortIcon column="username" />
              </button>
            </TableHead>
            <TableHead className="w-44">
              <button
                onClick={() => handleSort("role")}
                className="flex items-center hover:text-foreground transition-colors font-medium"
              >
                {t.users.columnRole}
                <SortIcon column="role" />
              </button>
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.username}</TableCell>
              <TableCell>
                <Select
                  value={user.role?.id ?? ""}
                  onValueChange={(roleId) => onRoleChange(user, roleId)}
                  disabled={updatingId === user.id}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue>
                      {user.role?.name ?? "—"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(user)}
                  disabled={updatingId === user.id}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
