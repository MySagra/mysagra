'use client'

import OrderCard from "@/components/order/orderCard";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Receipt, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import OrderSearch from "@/components/order/orderSearch";
import { useTranslations } from "next-intl";

export default function Dashboard() {
    const router = useRouter();
    const [text, setText] = useState("");
    const [orderUpdateLoading, setOrderUpdateLoading] = useState(false);
    const [orders, setOrders] = useState<Array<Order>>([]);

    const t = useTranslations('Operator.Dashboard');

    const lastOrders = useCallback(() => {
        setOrderUpdateLoading(true);
        setText("");
        fetch(`/api/orders/day/today`, {
            method: "GET",
            credentials: "include"
        }).then(async res => {
            setTimeout(() => setOrderUpdateLoading(false), 500);
            if (!res.ok) {
                if (res.status !== 404 && res.status !== 500) {
                    router.push("/login");
                }
                if (res.status == 404) {
                    toast.info(
                        t('fetchError.title'),
                        {
                            description: t('fetchError.description'),
                        }
                    );
                }
                return;
            }
            const data = await res.json();
            setOrders(data);
        }).catch(err => {
            console.log(err)
        })
    }, [router, t]);

    useEffect(() => {
        lastOrders();
    }, [lastOrders])

    function logOut() {
        fetch("/api/auth/logout", {
            method: "POST",
            credentials: "include"
        }).then(() => {
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            router.replace("/login");
        });
    }

    return (
        <>
            <main className="container mx-auto h-screen p-3 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5 p-3 md:w-[400px]">
                    <OrderSearch setOrders={setOrders} text={text} setText={setText} />
                    {
                        orderUpdateLoading ?
                            <Button className="bg-blue-500 hover:bg-blue-400 text-white" disabled>
                                <Loader2Icon className="animate-spin" />{t('fetchLoading')}
                            </Button>
                            :
                            <Button className="bg-blue-500 hover:bg-blue-400 text-white" onClick={() => lastOrders()}>
                                <Receipt /> {t('fetch')}
                            </Button>
                    }

                </div>

                <div className="flex flex-col gap-3 pb-20">
                    {
                        orders.map(order => (
                            <OrderCard order={order} key={order.id} value={text} />
                        ))
                    }
                </div>

            </main>
            <div className="flex items-center place-content-center p-5 fixed  w-full  bottom-0 bg-white">
                <Button variant="destructive" className="w-[250px]" onClick={() => logOut()}>
                    {t('exit')} <LogOut />
                </Button>
            </div>
        </>
    )
}