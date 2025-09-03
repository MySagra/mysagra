"use client"

import { Button } from "../ui/button"
import { ShoppingCart, Home } from "lucide-react"

import { useOrder } from "@/contexts/OrderContext";
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Header() {
    const t = useTranslations('Utils');
    const { order } = useOrder();
    const [price, setPrice] = useState<string>("0.00");
    const router = useRouter();

    useEffect(() => {
        setPrice(Number(order.price).toFixed(2));
    }, [order])

    return (
        <header className="fixed top-0 w-full flex p-3 place-content-between items-center z-50 bg-white">
            <h1 className="font-bold text-lg text-primary">{process.env.NEXT_PUBLIC_APP_NAME}</h1>
            <div className="flex flex-row gap-1">
                <Button
                    size="icon"
                    onClick={() => router.replace("/menu")}
                >
                    <Home />
                </Button>
                <Button
                    variant="outline"
                    className="flex flex-row gap-3"
                    onClick={() => router.replace("/recap")}
                >
                    <ShoppingCart />
                    <p className="min-w-16 text-end">{price} {t('currency')}</p>
                </Button>
            </div>
        </header>
    )
}