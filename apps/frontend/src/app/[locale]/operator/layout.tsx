'use client'

import { Toaster } from "sonner";

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <Toaster position="top-right" richColors theme="light"/>
        </>
    )
}