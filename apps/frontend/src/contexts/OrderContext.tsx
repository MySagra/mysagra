'use client';

import { createContext, ReactNode, useContext, useState } from "react";
import { Order } from "@/types/order";

type OrderContextType = {
    order: Order;
    setOrder: React.Dispatch<React.SetStateAction<Order>>;
};

const initialOrder: Order = {
    id: "",
    table: "",
    customer: '',
    price: 0,
    foodsOrdered: [],
    dateTime: new Date()
};

const OrderContext = createContext<OrderContextType>({
    order: initialOrder,
    setOrder: () => { },
});

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [order, setOrder] = useState<Order>(initialOrder);
    return (
        <OrderContext.Provider value={{ order, setOrder }}>
            {children}
        </OrderContext.Provider>
    );
};

export function useOrder() {
    return useContext(OrderContext);
}