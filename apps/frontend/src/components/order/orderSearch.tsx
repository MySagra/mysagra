"use client"

import { useRef, useState } from "react";
import { Input } from "../ui/input";
import { Order } from "@/types/order";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Loader2Icon, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OrderSearchProp {
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
    className?: string
    checkAll?: boolean
    text: string
    setText: React.Dispatch<React.SetStateAction<string>>
}

export default function OrderSearch({ setOrders, className, checkAll = false, text, setText }: OrderSearchProp) {
    const t = useTranslations('Operator.Dashboard');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null); //remove focus from keyboard

    const router = useRouter();

    function searchOrders(value: string) {
        if (!value) return;
        setLoading(true);

        const route = checkAll ? `/api/orders/search/${value}` : `/api/orders/search/daily/${value}`
        fetch(route, {
            method: "GET",
            credentials: "include"
        }).then(async res => {
            setTimeout(() => setLoading(false), 500);
            if (!res.ok) {
                if (res.status !== 404 && res.status !== 500) {
                    router.push("/auth/login");
                }
                if (res.status == 404) {
                    toast(
                        <p>{t('searchError.title')}<span className="font-bold">{`&quot;${text}&quot;`}</span></p>,
                        {
                            description: t('searchError.description')
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
    }

    return (
        <form
            className={cn("flex flex-row gap-2 items-center rounded-md", className)}
            onSubmit={e => {
                e.preventDefault();
                searchOrders(text);
                inputRef.current?.blur();
            }}
        >
            <Input
                ref={inputRef}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                className="hide-search-clear"
                placeholder={t('search')}
                value={text}
                onChange={e => {
                    setOrders([]);
                    setText(e.target.value);
                }}
            />

            {
                loading ?
                    <Button className="text-white" disabled size={"icon"}>
                        <Loader2Icon className="animate-spin" />
                    </Button>
                    :
                    <Button size={"icon"} type="submit">
                        <Search />
                    </Button>
            }

        </form>
    )
}