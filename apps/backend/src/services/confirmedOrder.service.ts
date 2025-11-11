import prisma from "@/utils/prisma";
import { ConfirmedOrder, CreateAndConfirmOrder, Order } from "@/schemas";
import { OrderItemService } from "./orderItem.service";
import { Prisma, OrderStatus, OrderItem } from "@generated/prisma_client";
import { EventService } from "./event.service";
import { EventName } from "@/schemas/event";
import { OrderService } from "./order.service";

export class ConfirmedOrderService {
    private orderItemService = new OrderItemService();
    private orderService = new OrderService();
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

    async getConfirmedOrders(filter?: OrderStatus | OrderStatus[]) {
        return await prisma.confirmedOrder.findMany({
            where: {
                ...(filter && {
                    status: Array.isArray(filter) ? { in: filter } : filter
                })
            }
        })
    }

    async createAndConfirmOrder(createAndConfirmOrder: CreateAndConfirmOrder) {
        const { order, confirm } = createAndConfirmOrder;

        const confirmedOrder = await prisma.$transaction(async (tx) => {
            const newOrder = await this.orderService.createOrder(order, tx);
            if (!newOrder) {
                throw new Error("Failed to create order");
            }
            return await this.confirmExistingOrder(newOrder.id, confirm, tx)
        })

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

    async confirmExistingOrder(orderId: number, order: ConfirmedOrder, tx?: Prisma.TransactionClient) {
        let confirmedOrder;
        if (!tx) {
            confirmedOrder = await prisma.$transaction(async (tx) => {
                return await this._confirmExistingOrderLogic(orderId, order, tx);
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
        }
        else {
            confirmedOrder = await this._confirmExistingOrderLogic(orderId, order, tx);
        }
        return confirmedOrder;
    }

    private async _confirmExistingOrderLogic(orderId: number, order: ConfirmedOrder, tx: Prisma.TransactionClient) {
        const { orderItems } = order;


        const ticketNumber = await this._getNextTicketNumber(tx);

        let items = [];

        if (!orderItems) {
            items = await this.orderItemService.getOrderItemsByOrderId(orderId, tx)
        }
        else {
            await this.orderItemService.deleteItemsFromOrder(orderId, tx);
            items = await this.orderItemService.createManyOrderItem(orderItems, orderId, tx);
        }

        const subTotal = items
            .map(i => i.quantity * i.food.price.toNumber())
            .reduce((acc, curr) => acc + curr, 0)

        return await tx.confirmedOrder.create({
            data: {
                orderId,
                ticketNumber,
                paymentMethod: order.paymentMethod,
                discount: order.discount || 0,
                surcharge: order.surcharge || 0,
                total: subTotal + (order.surcharge || 0) - (order.discount || 0)
            }
        })
    }

    async updateStatus(id: string, status: OrderStatus) {
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