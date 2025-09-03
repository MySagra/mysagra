'use client'

import { useTranslations } from "next-intl";
import Image from "next/image"
import Link from "next/link"
import { useState } from "react";

interface MenuButtonProps {
    title: string,
    src: string,
    href: string
}

export default function MenuButton({ title, src, href }: MenuButtonProps) {
    const t = useTranslations('Utils');
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
        <Link href={href}>
            <div className="grid w-full">
                <div className="relative w-full h-[150px] rounded-t-md rounded-b-none overflow-hidden bg-gray-200">
                    {!hasError ? (
                        <Image
                            src={src}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className={`object-cover transition-opacity duration-300 ${
                                isLoading ? 'opacity-0' : 'opacity-100'
                            }`}
                            onLoad={() => setIsLoading(false)}
                            onError={() => {
                                setHasError(true);
                                setIsLoading(false);
                            }}
                        />
                    ) : (
                        //fallback
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <div className="text-gray-500 text-center">
                                <div className="text-4xl mb-2">{"📷"}</div>
                                <div className="text-sm">{t('noImage')}</div>
                            </div>
                        </div>
                    )}
                    
                    {/* Loading skeleton */}
                    {isLoading && !hasError && (
                        <div className="absolute inset-0 bg-gray-300 animate-pulse">
                            <div className="w-full h-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
                        </div>
                    )}
                </div>
                <div className="min-h-[60px] text-2xl bg-primary rounded-b-md rounded-t-none flex place-content-center items-center text-foreground font-semibold p-3">
                    {title.toUpperCase()}
                </div>
            </div>
        </Link>
    )
}