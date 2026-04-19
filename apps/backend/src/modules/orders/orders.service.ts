import {
    ConfirmOrderInput,
    CreateOrder,
    GetOrdersQueryParams,
    OrderItem,
    OrderItemInput,
    OrderStatus,
    ReprintOrder
} from "@mysagra/schemas";

import { generateDisplayId } from "@/lib/idGenerator";
import { EventsService } from "../events/events.service";
import { prisma, Prisma } from "@mysagra/database";
import { redisConnection } from "@/lib/redis";
import { BadRequestError, NotFoundError } from "@/common/errors";
export class OrdersService {
    private cashierEvent = EventsService.getIstance('cashier');
    private displayEvent = EventsService.getIstance('display');
    private printerEvent = EventsService.getIstance('printer');

    private async _getNextTicketNumber(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        const redisKey = `ticket_counter:${today}`;

        const ticketNumber = await redisConnection.incr(redisKey);

        if (ticketNumber === 1) {
            const now = new Date();
            const expireAt = new Date(now);
            expireAt.setDate(expireAt.getDate() + 1);
            expireAt.setHours(6, 0, 0, 0);
            const secondsUntilExpiry = Math.floor((expireAt.getTime() - now.getTime()) / 1000);
            await redisConnection.expire(redisKey, secondsUntilExpiry);
        }

        return ticketNumber;
    }

    private async _getOrderCount(): Promise<number> {
        const redisKey = `order_count`;
        let orderCount = await redisConnection.incr(redisKey);
        if(orderCount === 1) {
            const dbCount = await prisma.order.count();

            if(dbCount > 0) {
                await redisConnection.set(redisKey, dbCount);
                orderCount = dbCount
            }
        }
        return orderCount;
    }

    async getOrders(queryParams: GetOrdersQueryParams) {
        const { limit, page } = queryParams;
        const skip = (page - 1) * limit;

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
                    [queryParams.sortBy]: 'desc'
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

    async getOrderById(id: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    orderBy: { food: { categoryId: 'asc' } },
                    include: {
                        food: {
                            omit: { available: true, categoryId: true },
                            include: {
                                category: { select: { id: true, name: true } },
                                foodIngredients: { select: { ingredient: true } }
                            }
                        }
                    }
                }
            }
        });

        if (!order) throw new NotFoundError("Order not found")

        const categoryMap = new Map<string, { category: { id: string; name: string }; items: unknown[] }>();

        for (const { id: itemId, quantity, notes, total, unitPrice, unitSurcharge, food } of order.orderItems) {
            const { category, foodIngredients, ...foodData } = food;

            let group = categoryMap.get(category.id);
            if (!group) {
                group = { category, items: [] };
                categoryMap.set(category.id, group);
            }

            group.items.push({
                id: itemId,
                quantity,
                notes,
                total,
                unitPrice,
                unitSurcharge,
                food: { ...foodData, ingredients: foodIngredients.map(fi => fi.ingredient) }
            });
        }

        const { orderItems: _, ...orderBaseData } = order;
        return { ...orderBaseData, categorizedItems: Array.from(categoryMap.values()) };
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
                    id: "",
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

                ticketNumber = await this._getNextTicketNumber();

                userId = confirm.userId
                cashRegisterId = confirm.cashRegisterId
            }

            const createdOrder = await tx.order.create({
                data: {
                    table: order.table.toString(),
                    customer: order.customer,
                    subTotal: subTotal,
                    displayCode: generateDisplayId(await this._getOrderCount()),

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

            //create order items
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
                    orderItems: {
                        select: {
                            id: true,
                            orderId: true,
                            quantity: true,
                            notes: true,
                            unitPrice: true,
                            unitSurcharge: true,
                            total: true,
                            food: {
                                select: {
                                    id: true,
                                    name: true,
                                    printerId: true
                                }
                            }
                        }
                    }
                }
            });
        })

        if (confirm) {
            EventsService.broadcastEvents(
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

        if (!createdOrder) return null;

        const { orderItems: items, ...orderData } = createdOrder;
        return {
            ...orderData,
            orderItems: items.map(({ food, ...item }) => ({
                ...item,
                foodId: food.id
            }))
        };
    }

    async confirmOrder(orderId: string, confirm: ConfirmOrderInput) {
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
                        id: "",
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

            const ticketNumber = await this._getNextTicketNumber();
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
                    cashRegisterId: confirm.cashRegisterId,
                    customer: confirm.customer
                },
                include: {
                    orderItems: {
                        select: {
                            id: true,
                            orderId: true,
                            quantity: true,
                            notes: true,
                            unitPrice: true,
                            unitSurcharge: true,
                            total: true,
                            food: {
                                select: {
                                    id: true,
                                    name: true,
                                    printerId: true
                                }
                            }
                        }
                    }
                }
            });

            return updatedOrder;
        });

        EventsService.broadcastEvents(
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

    async updateStatus(id: string, status: OrderStatus) {
        const patchedOrder = await prisma.order.update({
            where: {
                id
            },
            data: {
                status,
                completedAt: status === "COMPLETED" ? new Date() : null
            }
        })
        EventsService.broadcastEvents(
            [this.displayEvent],
            {
                id,
                ticketNumber: patchedOrder.ticketNumber,
                displayCode: patchedOrder.displayCode,
                status
            },
            "order-status-update"
        );
        return patchedOrder;
    }


    async deleteOrder(id: string) {
        await prisma.order.delete({
            where: {
                id
            }
        });
        return null;
    }

    async reprintOrder(id: string, reprint: ReprintOrder) {
        const order = await prisma.order.findUnique({
            where: {
                id
            },
            include: {
                orderItems: {
                    include: {
                        food: {
                            select: {
                                name: true,
                                id: true,
                                printerId: true
                            }
                        }
                    }
                },
            }
        })

        if (!order) {
            throw new NotFoundError("Order not found")
        }

        if(order.status === "PENDING"){
            throw new BadRequestError("Pending orders can't be reprinted");
        }

        let reprintOrderItems: typeof order.orderItems = []

        if (reprint.orderItems) {
            reprintOrderItems = order.orderItems.filter((item) => reprint.orderItems?.some(reprintItem => reprintItem === item.id))
        }

        if (reprint.orderItems && reprintOrderItems.length !== reprint.orderItems.length) {
            throw new Error("Some order items were not found");
        }

        this.printerEvent.broadcastEvent(
            {
                ...order,
                reprintOrderItems,
                reprintReceipt: reprint.reprintReceipt,
            },
            "reprint-order"
        );

        return {
            ...order,
            reprintOrderItems,
            reprintReceipt: reprint.reprintReceipt
        };
    }
}