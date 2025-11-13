import prisma from "@/utils/prisma";
import { ConfirmedOrder, Order, OrderQuery, Status } from "@/schemas";
import { generateDisplayId } from "@/lib/idGenerator";
import { EventService } from "./event.service";
import { Prisma } from "@/generated/prisma_client";

export class OrderService {
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

    async getOrders(queryParams: OrderQuery) {
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
            select: {
                id: true,
                displayCode: true,
                table: true,
                customer: true,
                subTotal: true,
                createdAt: true,

                orderItems: {
                    select: {
                        id: true,
                        quantity: true,
                        notes: true,

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

        const categoryMap = new Map<number, { category: { id: number, name: string }, items: any[] }>();

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

    async createOrder(order: Order) {
        const { orderItems, confirm } = order;

        const newOrder = await prisma.$transaction(async (tx) => {
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

            orderItems.forEach(item => {
                const price = foodMap.get(item.foodId);
                if (!price) throw new Error("Internal price error");

                const lineTotal = price.mul(item.quantity);
                subTotal = subTotal.add(lineTotal);
            });

            let total = subTotal;
            let finalStatus: Status = 'PENDING';
            let ticketNumber = null;
            let confirmedAt = null;

            if (confirm) {
                const discount = new Prisma.Decimal(confirm.discount || 0);
                const surcharge = new Prisma.Decimal(confirm.surcharge || 0);
                total = subTotal.add(surcharge).sub(discount);

                if (total.isNegative()) total = new Prisma.Decimal(0);

                finalStatus = 'CONFIRMED';
                confirmedAt = new Date();

                ticketNumber = await this._getNextTicketNumber(tx);
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
                    surcharge: confirm?.surcharge || 0,
                    total: total
                }
            });

            const displayCode = generateDisplayId(createdOrder.id);
            await tx.order.update({
                where: { id: createdOrder.id },
                data: { displayCode }
            });

            await tx.orderItem.createMany({
                data: orderItems.map(item => ({
                    quantity: item.quantity,
                    foodId: item.foodId,
                    orderId: createdOrder.id,
                    notes: item.notes || null
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
                this.events,
                {
                    displayCode: newOrder?.displayCode,
                    ticketNumber: newOrder?.ticketNumber,
                    id: newOrder?.id
                },
                "confirmed-order"
            )
        }

        // cashier only event
        this.events[0].broadcastEvent(newOrder, "new-order")
        return newOrder;
    }

    async confirmOrder(orderId: number, confirm: ConfirmedOrder) {
        const confirmedOrder = await prisma.$transaction(async (tx) => {
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { orderItems: { include: { food: true } } }
            });

            if (!existingOrder) throw new Error("Order not found");
            if (existingOrder.status !== 'PENDING') throw new Error("Order is already confirmed");

            let subTotal = new Prisma.Decimal(0);

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

                confirm.orderItems.forEach(item => {
                    const price = foodMap.get(item.foodId)!; // Safe thanks to the check above
                    // Use Decimal for precision
                    subTotal = subTotal.add(price.mul(item.quantity));
                });

                await tx.orderItem.createMany({
                    data: confirm.orderItems.map(item => ({
                        orderId: orderId,
                        foodId: item.foodId,
                        quantity: item.quantity,
                        notes: item.notes || null
                    }))
                });

            } else {
                existingOrder.orderItems.forEach(item => {
                    subTotal = subTotal.add(item.food.price.mul(item.quantity));
                });
            }

            const discount = new Prisma.Decimal(confirm.discount || 0);
            const surcharge = new Prisma.Decimal(confirm.surcharge || 0);

            let total = subTotal.add(surcharge).sub(discount);
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
                    surcharge: confirm.surcharge || 0,
                    subTotal: subTotal,
                    total: total
                },
                include: { orderItems: true } // Return updated items
            });

            return updatedOrder;
        });

        EventService.broadcastEvents(
            this.events,
            {
                displayCode: confirmedOrder.displayCode,
                ticketNumber: confirmedOrder.ticketNumber,
                id: confirmedOrder.id
            },
            "confirmed-order"
        );

        return confirmedOrder;
    }

    async updateStatus(id: number, status: Status){
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