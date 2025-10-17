"use client"

import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface OrderSearchProp {
    className?: string
    text: string
    setText: React.Dispatch<React.SetStateAction<string>>
}

export default function OrderSearch({ className, text, setText }: OrderSearchProp) {
    const t = useTranslations('Operator.Dashboard');

    return (
        <div className={cn("flex flex-row gap-2 items-center rounded-md", className)}>
            <Input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                className="hide-search-clear"
                placeholder={t('search')}
                value={text}
                onChange={e => setText(e.target.value)}
            />
        </div>
    )
}