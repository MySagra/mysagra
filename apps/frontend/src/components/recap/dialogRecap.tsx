
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "../ui/button"
import { Order } from "@/types/order"
import TableRecap from "./tableRecap"
import { useTranslations } from "next-intl"

interface DialogRecapProps {
    order: Order
}

export default function DialogRecap({ order }: DialogRecapProps) {
    const t = useTranslations('Order');

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    {t('trigger')}
                </Button>
            </DialogTrigger>
            <DialogContent className=" h-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('orderFor')} {order.customer}</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-row gap-3 place-content-between">
                            <nav>
                                {new Date(order.dateTime).toLocaleString(t('time'), {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </nav>
                            <nav>
                                {`${t('table')}: ${order.table}`}
                            </nav>
                            <nav>
                                {"ID: "} <span className="font-mono">{order.id}</span>
                            </nav>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <TableRecap key={order.id} order={order} />
            </DialogContent>
        </Dialog>
    )
}