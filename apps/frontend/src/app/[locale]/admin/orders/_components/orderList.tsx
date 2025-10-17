"use client"

import OrderCard from "@/components/order/orderCard";
import OrderPagination from "@/components/order/orderPagination";
import OrderSearch from "@/components/order/orderSearch";
import { Order } from "@/types/order";
import { useState } from "react";
import { useOrderByPage, useSearchOrder } from "@/hooks/api/order";
import { useTranslations } from "next-intl";

interface OrderListProps {
    page: number
}

export default function OrderList({ page }: OrderListProps) {
    const t = useTranslations('Order');
    const [text, setText] = useState("");

    // Fetch orders by page
    const { data: pageData, isLoading: isLoadingPage, isError: isErrorPage } = useOrderByPage(page);
    
    // Search orders when text is not empty
    const { data: searchOrders, isLoading: isLoadingSearch, isError: isErrorSearch } = useSearchOrder(text);

    // Determine which data to show
    const isSearching = text.trim().length > 0;
    const orders = isSearching ? searchOrders : pageData?.orders;
    const pagination = pageData?.pagination;
    const isLoading = isSearching ? isLoadingSearch : isLoadingPage;
    const isError = isSearching ? isErrorSearch : isErrorPage;

    if (isLoading) {
        return <div className="text-center py-8">{t('loading')}</div>;
    }

    if (isError) {
        return <div className="text-center py-8 text-red-500">{t('loadingError')}</div>;
    }

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex flex-col gap-6">
                <OrderSearch className="md:w-[300px]" text={text} setText={setText} />
                <div className="grid grid-col-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {
                        orders?.map(order => (
                            <OrderCard key={order.id} order={order} adminView />
                        ))
                    }
                </div>
            </div>
            {
                !isSearching && pagination && (
                    <OrderPagination pagination={pagination} />
                )
            }
        </div>
    )
}