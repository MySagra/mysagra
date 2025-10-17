import { OrderProvider } from "@/contexts/OrderContext";

import { ServiceTableProvider } from "@/contexts/ServiceTableContext";
import {Toaster} from "@/components/ui/sonner";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
    const serviceTable = process.env.ENABLE_TABLE_SERVICE === 'true'

    return (
        <OrderProvider>
            <ServiceTableProvider value={serviceTable}>
                <main className='bg-secondary'>
                    {children}
                </main>
                <Toaster position="top-center" richColors theme="light" />
            </ServiceTableProvider>
        </OrderProvider>
    );
}