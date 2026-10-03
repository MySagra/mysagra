"use client";

import { useEffect, useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/role-badge";
import { DeleteUserDialog } from "@/components/dashboard/users/delete-user-dialog";
import { useLocale } from "@/contexts/locale-context";
import type { Role, User } from "@/lib/api-types";
import { UserSheet } from "./user-sheet";

interface UsersTabProps {
  initialUsers: User[];
  roles: Role[];
  // notified when users are added or removed (settings tab counter)
  onCountChange?: (count: number) => void;
}

export function UsersTab({ initialUsers, roles, onCountChange }: UsersTabProps) {
  const { t } = useLocale();
  const [users, setUsers] = useState(initialUsers);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
    onCountChange?.(users.length);
  }, [users.length, onCountChange]);

  const sorted = [...users].sort((a, b) => a.username.localeCompare(b.username));

  function openCreate() {
    setEditingUser(undefined);
    setSheetOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setSheetOpen(true);
  }

  function handleSaved(saved: User, created: boolean) {
    setUsers((prev) => (created ? [...prev, saved] : prev.map((u) => (u.id === saved.id ? saved : u))));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">{t.adminSettings.usersDescription}</p>
        <Button onClick={openCreate}>
          <PlusIcon className="size-4" />
          {t.adminSettings.newUser}
        </Button>
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {sorted.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">{t.adminSettings.noUsers}</li>
        )}
        {sorted.map((user) => {
          return (
            <li key={user.id} className="flex items-center gap-3 px-4 py-3">
              {/* same avatar and role badge as the user menu in the sidebar */}
              <Avatar className="h-8 w-8 rounded-lg after:rounded-lg">
                <AvatarFallback className="rounded-lg uppercase">{user.username.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate text-sm font-medium">{user.username}</span>
                <RoleBadge role={user.role.name} className="mt-0.5" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => openEdit(user)} aria-label={`${t.adminSettings.edit} ${user.username}`}>
                <PencilIcon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeletingUser(user)}
                aria-label={`${t.adminSettings.delete} ${user.username}`}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          );
        })}
      </ul>

      <UserSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        roles={roles}
        user={editingUser}
        onSaved={handleSaved}
      />
      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        user={deletingUser}
        onDeleted={(id) => {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          setDeletingUser(null);
        }}
      />
    </div>
  );
}
