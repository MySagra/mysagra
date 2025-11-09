import prisma from "@/utils/prisma";
import { ConfirmedOrder, Order } from "@/schemas";
import { OrderItemService } from "./orderItem.service";
import { Prisma, OrderStatus } from "@generated/prisma_client";
import { EventService } from "./event.service";
import { EventName } from "@/schemas/event";

export class ConfirmedOrderService {
    private orderItemService = new OrderItemService();
    private events = [EventService.getIstance('cashier'), EventService.getIstance('display')]

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

    async getConfirmedOrders(filter?: OrderStatus | OrderStatus[]){
        return await prisma.confirmedOrder.findMany({
            where: {
                ...(filter && { 
                    status: Array.isArray(filter) ? { in: filter } : filter 
                })
            }
        })
    }


    async createConfirmedOrder(order: ConfirmedOrder) {
        const { orderItems, orderId } = order;

        
        const confirmedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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


        EventService.broadcastEvents(
            this.events,
            {
                orderId: confirmedOrder.orderId,
                ticketNumber: confirmedOrder.ticketNumber,
            },
            "confirmed-order"
        )

        return confirmedOrder;
    }

    async updateStatus(id: string, status: OrderStatus){
        return await prisma.confirmedOrder.update({
            where: {
                id
            },
            data: {
                status
            }
        })
    }
}