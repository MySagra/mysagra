'use client'

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button";
import { Order } from "@/types/order";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";
import { useTranslations } from "next-intl";

import { useTableService } from "@/contexts/ServiceTableContext";

export default function Checkout() {
    const tableServiceEnabled = useTableService();
    const [order, setOrder] = useState<Order>();
    const router = useRouter();
    const t = useTranslations("Checkout");

    useEffect(() => {
        const orderStr = sessionStorage.getItem("createdOrder");
        if (orderStr) setOrder(JSON.parse(orderStr));
    }, []);

    return (
        <div className="min-h-screen w-full flex flex-col gap-16 place-content-start items-center p-12">
            <div className="flex flex-col gap-3 items-center">
                <h1 className="font-bold text-xl text-center">
                    {
                        t.rich('title', {
                            highlight: (chunk) => <span className="text-red-500">{chunk}</span>
                        })
                    }
                </h1>
                <span className="font-bold font-mono text-9xl text-yellow-800">{order?.id}</span>
            </div>

            <div className="flex flex-col gap-0.5 items-center">
                <h3 className="text-2xl font-semibold">{t('cost')} {order?.price}{t('currency')}</h3>
                <p className="py-5 text-gray-600 text-center">{t('advise')}</p>
            </div>


            <div className="flex flex-col gap-2.5 text-lg font-normal">
                <h1 className="font-semibold text-2xl text-center">{t('steps.title')}</h1>
                <p>
                    {t('steps.step1')}
                </p>
                <p>
                    {t('steps.step2')}
                </p>
                <p>
                    {t('steps.step3')}
                </p>
                {
                    tableServiceEnabled ?
                        <p>
                            {t('steps.step4')}
                        </p>
                        :
                        <p>
                            {t('steps.noTableStep')}
                        </p>
                }


            </div>
            <div className="w-full inset-shadow-xs fixed bottom-0 p-3 bg-secondary flex place-content-center">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            {t('dialog.trigger')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('dialog.title')}</DialogTitle>
                            <DialogDescription>
                                {t.rich('dialog.description', {
                                    strong: (chunk) => <span className="font-bold">{chunk}</span>
                                })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                onClick={() => {
                                    sessionStorage.removeItem("createdOrder");
                                    router.push("/");
                                }}
                            >
                                {t('dialog.confirm')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

        </div>

    )

}