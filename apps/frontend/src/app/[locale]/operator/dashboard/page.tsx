'use client'

import OrderCard from "@/components/order/orderCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Receipt, Loader2Icon } from "lucide-react";
import OrderSearch from "@/components/order/orderSearch";
import { useTranslations } from "next-intl";
import { useDailyOrders, useDailySearchOrder } from "@/hooks/api/order";
import { LogoutButton } from "@/components/ui/logoutButton";

export default function Dashboard() {
    const t = useTranslations('Operator.Dashboard');
    const [text, setText] = useState("");

    const { data: allOrders, isError: isErrorAll, isFetching: isFetchingAll, refetch: refetchAll } = useDailyOrders();
    const { data: searchOrders, isError: isErrorSearch, isFetching: isFetchingSearch } = useDailySearchOrder(text);

    const orders = text.trim() ? searchOrders : allOrders;
    const isError = text.trim() ? isErrorSearch : isErrorAll;
    const isFetching = text.trim() ? isFetchingSearch : isFetchingAll;

    if (isError) {
        return <></> //TODO: add error handler component
    }

    return (
        <>
            <main className="container mx-auto h-screen p-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 p-3 md:w-[400px]">
                    <OrderSearch text={text} setText={setText} />
                    <Button
                        className="bg-blue-500 hover:bg-blue-400 text-white"
                        onClick={() => refetchAll()}
                        disabled={isFetching}
                    >
                        {isFetching ? (
                            <><Loader2Icon className="animate-spin" />{t('fetchLoading')}</>
                        ) : (
                            <><Receipt /> {t('fetch')}</>
                        )}
                    </Button>

                </div>

                <div className="flex flex-col gap-3 pb-20">
                    {
                        orders?.map(order => (
                            <OrderCard order={order} key={order.id} value={text} />
                        ))
                    }
                </div>

            </main>
            <div className="flex items-center place-content-center p-5 fixed  w-full  bottom-0 bg-white">
                <LogoutButton />
            </div>
        </>
    )
}