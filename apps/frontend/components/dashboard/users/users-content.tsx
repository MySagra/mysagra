"use client";

import { useState } from "react";
import { User, Role } from "@/lib/api-types";
import { patchUserRole } from "@/actions/users";
import { UsersToolbar } from "./users-toolbar";
import { UsersTable } from "./users-table";
import { UserDialog } from "./user-dialog";
import { DeleteUserDialog } from "./delete-user-dialog";
import { toast } from "sonner";
import { useLocale } from "@/contexts/locale-context";

interface UsersContentProps {
  initialUsers: User[];
  roles: Role[];
}

export function UsersContent({ initialUsers, roles }: UsersContentProps) {
  const { t } = useLocale();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleRoleChange(user: User, roleId: string) {
    setUpdatingId(user.id);
    const result = await patchUserRole(user.id, roleId);
    setUpdatingId(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === result.data.id ? result.data : u)));
    toast.success(t.users.toastUpdated);
  }

  function handleDelete(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  function handleCreated(created: User) {
    setUsers((prev) => [...prev, created]);
    setCreateDialogOpen(false);
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
          onCreateNew={() => setCreateDialogOpen(true)}
        />
        <UsersTable
          users={filteredUsers}
          roles={roles}
          onRoleChange={handleRoleChange}
          onDelete={handleDelete}
          updatingId={updatingId}
        />
      </div>
      <UserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        roles={roles}
        onCreated={handleCreated}
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
