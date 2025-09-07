"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Order } from "@/types/order";
import { useOrder } from "@/contexts/OrderContext";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { order, setOrder } = useOrder();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (order.customer !== "" && order.table !== "") {
            sessionStorage.setItem("order", JSON.stringify(order));
        }
    }, [order]);

    useEffect(() => {
        //check in session storage if order already created
        const createdOrderStr = sessionStorage.getItem("createdOrder");
        if (createdOrderStr) {
            const sessionCreatedOrder: Order = JSON.parse(createdOrderStr);
            if (sessionCreatedOrder.id !== "") {
                setLoading(false);
                return router.replace("/checkout");
            }
        }

        //check order in session storage
        const orderStr = sessionStorage.getItem("order");
        if (!orderStr) {
            setLoading(false);
            return router.replace("/");
        }

        const sessionOrder: Order = JSON.parse(orderStr);
        if (!(sessionOrder.customer && sessionOrder.table)) {
            setLoading(false);
            return router.replace("/");
        }
        
        setOrder(sessionOrder);
        setLoading(false);
    }, [router, setOrder, order.customer, order.table, setLoading]);

    // Opzionalmente, evita di mostrare nulla mentre aspetti il redirect
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center place-content-center">
                <LoaderCircle className=" h-20 animate-spin" />
            </div>
        );
    }

    return (
        <main>
            {children}
        </main>
    );
}
