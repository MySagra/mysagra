export const dynamic = "force-dynamic";

import { UserList } from "./_components/userList";
import { AdminHeader } from "../_components/layout/header"
import { getRoles } from "@/services/roles.service";
import { getUsers } from "@/services/users.service";
import { getTranslations } from "next-intl/server";

export default async function Users() {
    const t = await getTranslations('User')
    const roles = await getRoles();
    const users = await getUsers();

    return (
        <>
            <AdminHeader title={t('userManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <UserList initialUsers={users} roles={roles} />
                    </div>
                </div>
            </div>
        </>
    )
}
