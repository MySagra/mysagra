import { AdminHeader } from "../../_components/layout/header"
import { getOrders } from "@/services/orders.service";
import OrderList from "../_components/orderList";
import { getTranslations } from "next-intl/server";
import { getQueryClient } from "@/lib/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Orders({
    params
}: {
    params: Promise<{ page: number }>
}) {
    const { page } = await params;
    const queryClient = getQueryClient();

    // Prefetch orders data for the current page
    await queryClient.prefetchQuery({
        queryKey: ["orders", page],
        queryFn: () => getOrders(page)
    });

    const t = await getTranslations('Order');

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <AdminHeader title={t('ordersManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <OrderList page={page} />
                </div>
            </div>
        </HydrationBoundary>
    )
}
