import prisma from "@/utils/prisma";
import { ConfirmOrderInput, CreateOrder, GetOrdersQueryParams, OrderItem, OrderStatus } from "@/schemas";
import { generateDisplayId } from "@/lib/idGenerator";
import { EventService } from "./event.service";
import { Prisma } from "@/generated/prisma_client";

export class OrderService {
    private cashierEvent = EventService.getIstance('cashier');
    private displayEvent = EventService.getIstance('display');
    private printerEvent = EventService.getIstance('printer');

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

    async getOrders(queryParams: GetOrdersQueryParams) {
        const { limit, page } = queryParams;
        const skip = (1 - page) * limit;

        const where: Prisma.OrderWhereInput = {};

        if (queryParams.search) {
            where.OR = [
                { displayCode: { contains: queryParams.search } },
                { table: { contains: queryParams.search } },
                { customer: { contains: queryParams.search } }
            ]
        }

        if (queryParams.dateFrom || queryParams.dateTo) {
            where.createdAt = {}
            if (queryParams.dateFrom) {
                where.createdAt.gte = queryParams.dateFrom
            }
            if (queryParams.dateTo) {
                where.createdAt.lte = queryParams.dateTo
            }
        }

        if (queryParams.status) {
            where.status = {
                in: queryParams.status
            }
        }

        if (queryParams.displayCode) {
            where.displayCode = queryParams.displayCode
        }

        const query = await prisma.$transaction(async (tx) => {
            const count = await tx.order.count({
                where: where
            });
            const orders = await tx.order.findMany({
                where: where,
                skip: skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc'
                }
            })
            return {
                count,
                orders
            }
        })

        return {
            data: query.orders,
            pagination: {
                totalItems: query.count,
                currentPage: page,
                totalPages: Math.ceil(query.count / limit)
            }
        }
    }

    async getOrderById(id: number) {
        const order = await prisma.order.findUnique({
            where: {
                id
            },
            include: {
                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        notes: true,
                        total: true,
                        unitPrice: true,
                        unitSurcharge: true,
                        food: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                                price: true,

                                category: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },

                                foodIngredients: {
                                    select: {
                                        ingredient: {
                                            select: {
                                                id: true,
                                                name: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) return null;

        const categoryMap = new Map<string, { category: { id: string, name: string }, items: any[] }>();

        for (const item of order.orderItems) {
            const category = item.food.category;

            if (!categoryMap.has(category.id)) {
                categoryMap.set(category.id, {
                    category: category,
                    items: []
                });
            }
            const group = categoryMap.get(category.id)!;
            const ingredients = item.food.foodIngredients.map(fi => fi.ingredient);
            const { category: _c, foodIngredients: _fi, ...foodData } = item.food;

            group.items.push({
                id: item.id,
                quantity: item.quantity,
                notes: item.notes,
                total: item.total,
                unitPrice: item.unitPrice,
                unitSurcharge: item.unitSurcharge,
                food: {
                    ...foodData,
                    ingredients: ingredients
                }
            });
        }

        const { orderItems, ...orderBaseData } = order;

        return {
            ...orderBaseData,
            categorizedItems: Array.from(categoryMap.values())
        };
    }

    async createOrder(order: CreateOrder) {
        const { orderItems, confirm } = order;

        const createdOrder = await prisma.$transaction(async (tx) => {
            const foodIds = orderItems.map(item => item.foodId);
            const foods = await tx.food.findMany({
                where: { id: { in: foodIds } },
                select: { id: true, price: true }
            });

            if (foods.length !== new Set(foodIds).size) {
                throw new Error("One or more requested products do not exist or are invalid");
            }

            const foodMap = new Map(foods.map(f => [f.id, f.price]));
            let subTotal = new Prisma.Decimal(0);
            let totalSurcharge = new Prisma.Decimal(0);
            const createOrderItems: Array<OrderItem> = []

            orderItems.forEach(item => {
                const price = foodMap.get(item.foodId)!;

                const surcharge = confirm ? item.surcharge : 0

                const createItem = {
                    foodId: item.foodId,
                    quantity: item.quantity,
                    notes: item.notes,
                    unitPrice: price.toNumber(),
                    surcharge: surcharge,
                    total: surcharge + price.toNumber() * item.quantity
                }

                createOrderItems.push(createItem)
                subTotal = subTotal.add(createItem.unitPrice * createItem.quantity);
                totalSurcharge = totalSurcharge.add(surcharge);
            });

            let total = subTotal;
            let finalStatus: OrderStatus = 'PENDING';
            let ticketNumber = null;
            let confirmedAt = null;
            let userId = null;
            let cashRegisterId = null;

            if (confirm) {
                const discount = new Prisma.Decimal(confirm.discount || 0);
                const surcharge = new Prisma.Decimal(totalSurcharge || 0);
                total = subTotal.add(surcharge).sub(discount);

                if (total.isNegative()) total = new Prisma.Decimal(0);

                finalStatus = 'CONFIRMED';
                confirmedAt = new Date();

                ticketNumber = await this._getNextTicketNumber(tx);

                userId = confirm.userId
                cashRegisterId = confirm.cashRegisterId
            }

            const createdOrder = await tx.order.create({
                data: {
                    table: order.table.toString(),
                    customer: order.customer,
                    subTotal: subTotal,

                    status: finalStatus,
                    confirmedAt: confirmedAt,
                    ticketNumber: ticketNumber,

                    paymentMethod: confirm?.paymentMethod || null,
                    discount: confirm?.discount || 0,
                    surcharge: totalSurcharge || 0,
                    total: total,

                    userId: userId,
                    cashRegisterId: cashRegisterId
                }
            });

            const displayCode = generateDisplayId(createdOrder.id);
            await tx.order.update({
                where: { id: createdOrder.id },
                data: { displayCode }
            });

            await tx.orderItem.createMany({
                data: createOrderItems.map(item => ({
                    orderId: createdOrder.id,
                    foodId: item.foodId,
                    quantity: item.quantity,
                    notes: item.notes || null,
                    unitPrice: item.unitPrice!,
                    unitSurcharge: item.surcharge / item.quantity,
                    total: item.total!
                }))
            });

            return await tx.order.findUnique({
                where: { id: createdOrder.id },
                include: {
                    orderItems: true
                }
            });
        })

        if (confirm) {
            EventService.broadcastEvents(
                [this.cashierEvent, this.displayEvent],
                {
                    displayCode: createdOrder?.displayCode,
                    ticketNumber: createdOrder?.ticketNumber,
                    id: createdOrder?.id
                },
                "confirmed-order"
            )

            this.printerEvent.broadcastEvent(
                createdOrder,
                "confirmed-order"
            );
        }

        // cashier only event
        if (!confirm) {
            this.cashierEvent.broadcastEvent(createdOrder, "new-order")
        }

        return createdOrder;
    }

    async confirmOrder(orderId: number, confirm: ConfirmOrderInput) {
        const confirmedOrder = await prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { orderItems: { include: { food: true } } }
            });

            if (!existingOrder) throw new Error("Order not found");
            if (existingOrder.status !== 'PENDING') throw new Error("Order is already confirmed");

            let subTotal = new Prisma.Decimal(0);
            let totalSurcharge = new Prisma.Decimal(0);

            if (confirm.orderItems && confirm.orderItems.length > 0) {
                await tx.orderItem.deleteMany({ where: { orderId } });

                const foodIds = confirm.orderItems.map(item => item.foodId);
                const foods = await tx.food.findMany({
                    where: { id: { in: foodIds }, available: true },
                    select: { id: true, price: true }
                });

                if (foods.length !== new Set(foodIds).size) {
                    throw new Error("One or more products do not exist or are not available");
                }

                const foodMap = new Map(foods.map(f => [f.id, f.price]));
                const createOrderItems: Array<OrderItem> = [];

                confirm.orderItems.forEach(item => {
                    const price = foodMap.get(item.foodId)!;
                    const createItem = {
                        foodId: item.foodId,
                        quantity: item.quantity,
                        notes: item.notes,
                        unitPrice: price.toNumber(),
                        surcharge: item.surcharge,
                        total: item.surcharge + price.toNumber() * item.quantity
                    };

                    createOrderItems.push(createItem);
                    subTotal = subTotal.add(createItem.unitPrice * createItem.quantity);
                    totalSurcharge = totalSurcharge.add(item.surcharge);
                });

                await tx.orderItem.createMany({
                    data: createOrderItems.map(item => ({
                        orderId: orderId,
                        foodId: item.foodId,
                        quantity: item.quantity,
                        notes: item.notes || null,
                        unitPrice: item.unitPrice!,
                        unitSurcharge: item.surcharge / item.quantity,
                        total: item.total!
                    }))
                });

            } else {
                existingOrder.orderItems.forEach(item => {
                    subTotal = subTotal.add(item.food.price.mul(item.quantity));
                });
            }

            const discount = new Prisma.Decimal(confirm.discount || 0);

            let total = subTotal.add(totalSurcharge).sub(discount)
            if (total.isNegative()) total = new Prisma.Decimal(0);

            const ticketNumber = await this._getNextTicketNumber(tx);

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CONFIRMED',
                    confirmedAt: new Date(),
                    ticketNumber: ticketNumber,
                    paymentMethod: confirm.paymentMethod,
                    discount: confirm.discount || 0,
                    surcharge: totalSurcharge || 0,
                    subTotal: subTotal,
                    total: total,
                    userId: confirm.userId,
                    cashRegisterId: confirm.cashRegisterId
                },
                include: {
                    orderItems: true // Return updated items
                }
            });

            return updatedOrder;
        });

        EventService.broadcastEvents(
            [this.cashierEvent, this.displayEvent],
            {
                displayCode: confirmedOrder.displayCode,
                ticketNumber: confirmedOrder.ticketNumber,
                id: confirmedOrder.id
            },
            "confirmed-order"
        );

        this.printerEvent.broadcastEvent(
            confirmedOrder,
            "confirmed-order"
        );


        return confirmedOrder;
    }

    async updateStatus(id: number, status: OrderStatus) {
        return await prisma.order.update({
            where: {
                id
            },
            data: {
                status
            }
        })
    }


    async deleteOrder(id: number) {
        await prisma.order.delete({
            where: {
                id
            }
        });
        return null;
    }
}