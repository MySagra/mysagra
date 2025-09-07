import { AdminHeader } from "../../_components/layout/header"
import { getOrders } from "@/services/orders.service";
import OrderList from "../_components/orderList";
import { getTranslations } from "next-intl/server";

export default async function Orders({
    params
}: {
    params: Promise<{ page: number }>
}) {
    const { page } = await params
    const { pagination, orders } = await getOrders(page);

    const t = await getTranslations('Order')

    return (
        <>
            <AdminHeader title={t('ordersManagement')} />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <OrderList initialOrders={orders} pagination={pagination} />
                </div>
            </div>
        </>
    )
}
