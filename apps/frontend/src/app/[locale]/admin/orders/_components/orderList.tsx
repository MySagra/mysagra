"use client"

import OrderCard from "@/components/order/orderCard";
import OrderPagination from "@/components/order/orderPagination";
import OrderSearch from "@/components/order/orderSearch";
import { Order } from "@/types/order";
import { Page } from "@/types/page";
import { useState } from "react";

interface OrderListProps {
    initialOrders: Array<Order>
    pagination: Page
}

export default function OrderList({ initialOrders, pagination }: OrderListProps) {

    const [orders, setOrders] = useState(initialOrders);
    const [searchOrders, setSearchOrders] = useState<Array<Order>>([]);
    const [text, setText] = useState("");

    return (
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 flex flex-col gap-6">
                <OrderSearch setOrders={setSearchOrders} className=" md:w-[300px]" checkAll text={text} setText={setText} />
                <div className="grid grid-col-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {
                        text === "" ?
                            orders.map(order => (
                                <OrderCard key={order.id} order={order} setOrders={setOrders} adminView />
                            )) :
                            searchOrders.map(order => (
                                <OrderCard key={order.id} order={order} setOrders={setSearchOrders} adminView />
                            ))
                    }
                </div>
            </div>
            {
                text === "" ?
                    <OrderPagination pagination={pagination} /> : <></>
            }

        </div>
    )

}