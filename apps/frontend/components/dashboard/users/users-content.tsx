"use client";

import { useState } from "react";
import { User, Role } from "@/lib/api-types";
import { UsersToolbar } from "./users-toolbar";
import { UsersTable } from "./users-table";
import { UserDialog } from "./user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";

interface UsersContentProps {
  initialUsers: User[];
  roles: Role[];
}

export function UsersContent({ initialUsers, roles }: UsersContentProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handleCreate() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function handleDelete(user: User) {
    setDeletingUser(user);
    // Close edit dialog first, then open delete dialog after animation completes
    setDialogOpen(false);
    setEditingUser(null);
    setTimeout(() => {
      setDeleteDialogOpen(true);
    }, 150);
  }

  function handleSaved(saved: User) {
    if (editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
    } else {
      setUsers((prev) => [...prev, saved]);
    }
    setDialogOpen(false);
    setEditingUser(null);
  }

  function handleDeleted(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteDialogOpen(false);
    setDeletingUser(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        <UsersToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateNew={handleCreate}
        />
        <UsersTable
          users={filteredUsers}
          onEdit={handleEdit}
        />
      </div>
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        roles={roles}
        onSaved={handleSaved}
        onDelete={handleDelete}
      />
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={deletingUser}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
