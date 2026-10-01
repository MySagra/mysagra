import { Prisma } from "@mysagra/database";
import type { ConfirmedOrder } from "@mysagra/database";

/*
 * The DB splits an order into `orders` (base data) and `confirmed_orders` (1:0..1, confirmation data).
 * The API keeps the historical flat shape, so confirmation fields are lifted to the top level
 * and filled with "pending" defaults when the order has not been confirmed yet.
 */

type ConfirmationData = Partial<ConfirmedOrder>;

type FlattenableOrder = {
    subTotal: Prisma.Decimal;
    surcharge: Prisma.Decimal;
    confirmedOrder: ConfirmationData | null;
};

export function flattenOrder<O extends FlattenableOrder>(order: O) {
    const { confirmedOrder, ...base } = order;

    if (!confirmedOrder) {
        return {
            ...base,
            ticketNumber: null,
            confirmedAt: null,
            completedAt: null,
            paymentMethod: null,
            discount: new Prisma.Decimal(0),
            total: base.subTotal.add(base.surcharge),
            userId: null,
            cashRegisterId: null
        };
    }

    const { orderId: _orderId, ...confirmation } = confirmedOrder as NonNullable<O["confirmedOrder"]>;
    return { ...base, ...confirmation };
}
