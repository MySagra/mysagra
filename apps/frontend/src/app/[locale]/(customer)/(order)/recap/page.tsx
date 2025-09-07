"use client"

import { useOrder } from "@/contexts/OrderContext"
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";

import TableRecap from "@/components/recap/tableRecap";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function Recap() {
    const { order, setOrder } = useOrder();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const t = useTranslations('OrderRecap')

    function createOrder() {
        setLoading(true);
        fetch("/api/orders", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                table: order.table,
                customer: order.customer,
                foodsOrdered: order.foodsOrdered
            })
        }).then(async res => {
            const data = await res.json();

            setTimeout(() => {
                sessionStorage.setItem("createdOrder", JSON.stringify(data));
                setLoading(false)
                router.replace(`/checkout`);
                clearOrder();
            }, 500)


        }).catch(err => {
            console.log(err);
        })
    }

    function clearOrder() {
        setOrder({
            id: "",
            table: order.table,
            customer: order.customer,
            price: 0,
            foodsOrdered: [],
            dateTime: new Date()
        })
    }

    return (
        <div className="pt-[60px] h-screen flex flex-col gap-4 pb-4">
            <TableRecap order={order} className="bg-white"></TableRecap>

            <div className="flex flex-row gap-2 place-content-center">
                <Button onClick={() => clearOrder()} variant="destructive">
                    {t('clear')}
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            disabled={order.foodsOrdered.length === 0}
                        >
                            {t('create')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('dialog.title')}</DialogTitle>
                            <DialogDescription>
                                {
                                    t.rich('dialog.description', {
                                        strong: (chunks) => <span className="font-bold">{chunks}</span>
                                    })
                                }
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            {
                                loading ?
                                    <Button className="text-white" disabled>
                                        <Loader2Icon className="animate-spin" /> {t('dialog.loading')}
                                    </Button>
                                    :
                                    <Button onClick={() => createOrder()}>
                                        {t('dialog.confirm')}
                                    </Button>
                            }
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}