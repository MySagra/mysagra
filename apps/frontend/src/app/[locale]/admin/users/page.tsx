import { UserList } from "./_components/userList";
import { AdminHeader } from "../_components/layout/header"
import { getRoles } from "@/services/roles.service";
import { getUsers } from "@/services/users.service";
import { getTranslations } from "next-intl/server";
import { getQueryClient } from "@/lib/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Users() {
    const queryClient = getQueryClient();

    // Prefetch users data
    await queryClient.prefetchQuery({
        queryKey: ["users"],
        queryFn: getUsers
    });

    const roles = await getRoles();
    const t = await getTranslations('User');

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdminHeader title={t('userManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <UserList roles={roles} />
                    </div>
                </div>
            </div>
        </HydrationBoundary>
    )
}
