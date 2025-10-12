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
import { useTranslations } from "next-intl";
import { useCreateOrder } from "@/hooks/api/order";
import { toast } from "sonner";

export default function Recap() {
    const { order, setOrder } = useOrder();
    const router = useRouter();
    const t = useTranslations('OrderRecap')

    const { mutate: createOrder, isPending } = useCreateOrder();

    function handleCreateOrder() {
        const orderForBackend = {
            dateTime: order.dateTime,
            table: order.table,
            customer: order.customer,
            foodsOrdered: order.foodsOrdered.map(item => ({
                foodId: item.food.id, // use foodId as required by OrderRequest
                quantity: item.quantity
            }))
        };

        createOrder(orderForBackend, {
            onSuccess: (data) => {
                setTimeout(() => {
                    sessionStorage.setItem("createdOrder", JSON.stringify(data));
                    router.replace(`/checkout`);
                    clearOrder();
                }, 500);
            },
            onError: () => {
                toast.error("Failed to create order");
            }
        });
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
                                isPending ?
                                    <Button className="text-white" disabled>
                                        <Loader2Icon className="animate-spin" /> {t('dialog.loading')}
                                    </Button>
                                    :
                                    <Button onClick={() => handleCreateOrder()}>
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