import prisma from "@/utils/prisma";
import { ConfirmedOrder } from "@/schemas";
import { OrderItemService } from "./orderItem.service";
import { Prisma } from "@generated/prisma_client";

export class ConfirmedOrderService {
    private orderItemService = new OrderItemService();

    private async _getNextTicketNumber(tx: Prisma.TransactionClient): Promise<number> {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const dateOnly = new Date(today.toISOString().split('T')[0]);

        const ticketCount = await tx.dailyTicketCounter.upsert({
            where: { date: dateOnly },
            create: { date: dateOnly, counter: 1 },
            update: { counter: { increment: 1 } }
        })

        return ticketCount.counter;
    }


    async createConfirmedOrder(order: ConfirmedOrder) {
        const { orderItems, orderId } = order;

        return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const ticketNumber = await this._getNextTicketNumber(tx);

            await this.orderItemService.deleteItemsFromOrder(orderId, tx);
            const createdItems = await this.orderItemService.createManyOrderItem(orderItems, orderId, tx);

            const subTotal = createdItems
                .map(i => i.quantity * i.food.price.toNumber())
                .reduce((acc, curr) => acc + curr, 0)

            const confirmedOrder = await tx.confirmedOrder.create({
                data: {
                    orderId,
                    ticketNumber,
                    paymentMethod: order.paymentMethod,
                    discount: order.discount || 0,
                    surcharge: order.surcharge || 0,
                    total: subTotal + (order.surcharge || 0) - (order.discount || 0)
                }
            })

            return confirmedOrder;
        },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable
            }
        )
    }
}