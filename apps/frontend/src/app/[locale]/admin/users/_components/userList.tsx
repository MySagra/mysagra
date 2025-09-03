'use client'

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Role, User } from "@/types/user";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { UserDialog } from "./userDialog";
import { DialogAction } from "@/components/ui/dialogAction";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface UserListProp {
    initialUsers: Array<User>
    roles: Array<Role>
}

export function UserList({ roles, initialUsers }: UserListProp) {
    const [users, setUsers] = useState(initialUsers);
    const [thisUser, setThisUser] = useState({ username: "", role: "" });

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        setThisUser(JSON.parse(userStr));
    }, [])

    return (
        <div className="flex flex-col gap-3 px-4 lg:px-6">
            <UserDialog setUsers={setUsers} roles={roles} />

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {
                    users.map(user => (
                        <UserCard key={user.id} user={user} thisUser={thisUser.username} setUsers={setUsers} />
                    ))
                }
            </div>
        </div>
    )
}

interface UserCardProp {
    user: User
    thisUser: string
    setUsers: React.Dispatch<React.SetStateAction<User[]>>
}

function UserCard({ user, thisUser, setUsers }: UserCardProp) {
    const t = useTranslations('User');

    function deleteUser() {
        fetch(`/api/users/${user.id}`, {
            method: "DELETE",
            credentials: "include"
        }).then(async res => {
            await res.json();
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
            }
        }).then(() => {
            toast.success(t('toast.deleteSuccess'));
        }).catch(err => {
            toast.error(t('toast.deleteError'));
            console.error(err);
        })
    }

    return (
        <div className="bg-secondary p-3 rounded-md flex place-content-between items-center">
            <div className="flex flex-col gap-0.5 items-start">
                <h3 className="font-semibold text-xl">
                    {user.username}
                </h3>
                <p className="text-sm">
                    <Badge variant={user.role.name === "operator" ? "outline" : "default"} >
                        {user.role.name}
                    </Badge>
                </p>
            </div>
            <DialogAction
                title={t('delete.title')}
                variant={'destructive'}
                action={() => deleteUser()}
                buttonText={t('delete.buttonText')}
                trigger={
                    <Button disabled={thisUser == user.username} variant={'destructive'} size={"icon"} className="size-7">
                        <Trash2 />
                    </Button>
                }
            >
                <p>
                    {t.rich('delete.description', {
                        strong: (chunk) => <span className="font-bold">{chunk}</span>
                    })}
                </p>
            </DialogAction>
        </div>
    )
}