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
        if (orderCount === 1) {
            const dbCount = await prisma.order.count();

            if (dbCount > 0) {
                await redisConnection.set(redisKey, dbCount);
                orderCount = dbCount
            }
        }
        return orderCount;
    }

    private async _updateReportsOnOrderCancellation(tx: Prisma.TransactionClient, orderId: string) {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: {
                orderItems: {
                    include: {
                        food: {
                            select: {
                                categoryId: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!order || !order.confirmedAt) return;

        const affectedReport = await tx.report.findFirst({
            where: {
                timestamp: {
                    gt: order.confirmedAt
                }
            },
            orderBy: { timestamp: 'asc' },
            include: {
                categoryStats: {
                    include: {
                        foodStats: true
                    }
                },
                cashRegisterStats: true
            }
        });

        if (!affectedReport) return;

        const reportStartTime = new Date(affectedReport.timestamp.getTime() - affectedReport.intervalInMinutes * 60 * 1000);
        if (order.confirmedAt < reportStartTime) return;

        const orderTotal = Number(order.total);
        const orderCashRevenue = order.paymentMethod === 'CASH' ? orderTotal : 0;
        const orderCardRevenue = order.paymentMethod === 'CARD' ? orderTotal : 0;

        const updatedCategoryStats = affectedReport.categoryStats.map(catStat => {
            const itemsInCategory = order.orderItems.filter(item => item.food.categoryId === catStat.categoryId);

            if (itemsInCategory.length === 0) {
                return catStat;
            }

            const categoryRevenue = itemsInCategory.reduce((sum, item) => sum + Number(item.total), 0);
            const categoryQuantity = itemsInCategory.reduce((sum, item) => sum + item.quantity, 0);

            return {
                ...catStat,
                revenue: Number(catStat.revenue) - categoryRevenue,
                quantity: catStat.quantity - categoryQuantity,
                foodStats: catStat.foodStats.map(foodStat => {
                    const matchingItems = itemsInCategory.filter(item => item.foodId === foodStat.foodId);

                    if (matchingItems.length === 0) {
                        return foodStat;
                    }

                    const foodRevenue = matchingItems.reduce((sum, item) => sum + Number(item.total), 0);
                    const foodQuantity = matchingItems.reduce((sum, item) => sum + item.quantity, 0);

                    return {
                        ...foodStat,
                        revenue: Number(foodStat.revenue) - foodRevenue,
                        quantity: foodStat.quantity - foodQuantity
                    };
                })
            };
        });

        const updatedCashRegisterStats = affectedReport.cashRegisterStats.map(crStat => {
            if (order.cashRegisterId !== crStat.cashRegisterId) {
                return crStat;
            }

            return {
                ...crStat,
                totalRevenue: Number(crStat.totalRevenue) - orderTotal,
                totalCashRevenue: Number(crStat.totalCashRevenue) - orderCashRevenue,
                totalCardRevenue: Number(crStat.totalCardRevenue) - orderCardRevenue
            };
        });

        await tx.report.update({
            where: { id: affectedReport.id },
            data: {
                totalRevenue: Number(affectedReport.totalRevenue) - orderTotal,
                totalCashRevenue: Number(affectedReport.totalCashRevenue) - orderCashRevenue,
                totalCardRevenue: Number(affectedReport.totalCardRevenue) - orderCardRevenue,
                totalOrders: affectedReport.totalOrders - 1,
                categoryStats: {
                    deleteMany: {},
                    create: updatedCategoryStats.map(catStat => ({
                        categoryId: catStat.categoryId,
                        categoryName: catStat.categoryName,
                        revenue: catStat.revenue,
                        quantity: catStat.quantity,
                        foodStats: {
                            create: catStat.foodStats.map(foodStat => ({
                                foodId: foodStat.foodId,
                                foodName: foodStat.foodName,
                                revenue: foodStat.revenue,
                                quantity: foodStat.quantity
                            }))
                        }
                    }))
                },
                cashRegisterStats: {
                    deleteMany: {},
                    create: updatedCashRegisterStats.map(crStat => ({
                        cashRegisterId: crStat.cashRegisterId,
                        cashRegisterName: crStat.cashRegisterName,
                        totalRevenue: crStat.totalRevenue,
                        totalCashRevenue: crStat.totalCashRevenue,
                        totalCardRevenue: crStat.totalCardRevenue
                    }))
                }
            }
        });
    }

    async getOrders(queryParams: GetOrdersQueryParams) {
        const { limit, page, include } = queryParams;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {};

        if (queryParams.search) {
            where.OR = [
                { displayCode: { contains: queryParams.search } },
                { table: { contains: queryParams.search } },
                { customer: { contains: queryParams.search } },
                { ticketNumber: { equals: parseInt(queryParams.search) } }
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
                },
                include: {
                    orderStationStates: include === "ordersStationsStates" ? {
                        select: {
                            stationId: true,
                            status: true
                        }
                    } : false
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
                orderStationStates: true,
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
                },
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

            const stationIds = await tx.$queryRaw<Array<{ stationId: string }>>`
                SELECT DISTINCT s.id as stationId
                FROM orders o JOIN order_items oi ON o.id = oi.orderId
                JOIN foods f ON oi.foodId = f.id
                JOIN categories c ON c.id = f.categoryId
                JOIN stations s ON s.id = c.stationId
                WHERE o.id = ${createdOrder.id}
            `

            await tx.orderStationStatus.createMany({
                data: stationIds.map(({ stationId }) => ({
                    orderId: createdOrder.id,
                    stationId,
                    status: finalStatus
                }))
            })

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
                                    printerId: true,
                                    category: {
                                        select: {
                                            id: true,
                                            name: true,
                                            station: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        })

        if (confirm) {
            this.cashierEvent.broadcastEvent(
                {
                    displayCode: createdOrder?.displayCode,
                    ticketNumber: createdOrder?.ticketNumber,
                    id: createdOrder?.id
                },
                "confirmed-order"
            )

            const ordersStations = (await prisma.$queryRaw<Array<{ stationId: string }>>`
                SELECT DISTINCT os.stationId
                FROM orders_stations_states os
                WHERE os.orderId = ${createdOrder?.id}
            `).map(({ stationId }) => stationId)

            this.displayEvent.broadcastEvent(
                {
                    displayCode: createdOrder?.displayCode,
                    ticketNumber: createdOrder?.ticketNumber,
                    id: createdOrder?.id,
                    ordersStations
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
                    where: { id: { in: foodIds } },
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
                                    printerId: true,
                                    category: {
                                        select: {
                                            id: true,
                                            name: true,
                                            station: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            await tx.orderStationStatus.updateMany({
                where: { orderId },
                data: {
                    status: "CONFIRMED"
                }
            })

            return updatedOrder;
        });

        this.cashierEvent.broadcastEvent(
            {
                displayCode: confirmedOrder.displayCode,
                ticketNumber: confirmedOrder.ticketNumber,
                id: confirmedOrder.id
            },
            "confirmed-order"
        )

        const ordersStations = (await prisma.$queryRaw<Array<{ stationId: string }>>`
            SELECT DISTINCT os.stationId
            FROM orders_stations_states os
            WHERE os.orderId = ${confirmedOrder?.id}
        `).map(({ stationId }) => stationId)

        this.displayEvent.broadcastEvent(
            {
                displayCode: confirmedOrder.displayCode,
                ticketNumber: confirmedOrder.ticketNumber,
                id: confirmedOrder.id,
                ordersStations
            },
            "confirmed-order"
        )

        this.printerEvent.broadcastEvent(
            confirmedOrder,
            "confirmed-order"
        );


        return confirmedOrder;
    }

    async updateStatus(id: string, status: OrderStatus) {
        if (status == "CANCELLED") {
            return await this.deleteOrder(id)
        }

        const patchedOrder = await prisma.$transaction(async tx => {
            const order = await tx.order.update({
                where: {
                    id
                },
                data: {
                    status,
                    completedAt: status === "COMPLETED" ? new Date() : null
                }
            })

            await tx.orderStationStatus.updateMany({
                where: { orderId: order.id },
                data: { status }
            })

            return order;
        })
        EventsService.broadcastEvents(
            [this.displayEvent, this.cashierEvent],
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
        return await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                select: { status: true, ticketNumber: true, displayCode: true }
            });

            if (!order) return null;

            if (order.status !== "PENDING") {
                await this._updateReportsOnOrderCancellation(tx, id);

                const updatedOrder = await tx.order.update({
                    where: { id },
                    data: { status: "CANCELLED" }
                });

                await tx.orderStationStatus.updateMany({
                    where: { orderId: id },
                    data: { status: "CANCELLED" }
                })

                // Select all distinct printers in an order
                const printers: { printerId: string }[] = await tx.$queryRaw
                    `
                    SELECT DISTINCT f.printerId
                    FROM orders o JOIN order_items oi ON o.id = oi.orderId
                    JOIN foods f ON oi.foodId = f.id
                `
                const printerIds = printers.map(p => p.printerId)

                EventsService.broadcastEvents(
                    [this.displayEvent, this.cashierEvent],
                    {
                        id,
                        ticketNumber: updatedOrder.ticketNumber,
                        displayCode: updatedOrder.displayCode,
                        status: updatedOrder.status
                    },
                    "order-cancelled"
                );

                this.printerEvent.broadcastEvent(
                    {
                        orderId: id,
                        ticketNumber: updatedOrder.ticketNumber,
                        displayCode: updatedOrder.displayCode,
                        customer: updatedOrder.customer,
                        table: updatedOrder.table,
                        status: updatedOrder.status,
                        printers: printerIds
                    },
                    "order-cancelled"
                );

                return updatedOrder;
            }

            await tx.order.delete({
                where: { id }
            });

            return null;
        });
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
                                id: true,
                                name: true,
                                printerId: true,
                                category: {
                                    select: {
                                        id: true,
                                        name: true,
                                        station: true
                                    }
                                }
                            }
                        }
                    }
                },
            }
        })

        if (!order) {
            throw new NotFoundError("Order not found")
        }

        if (order.status === "PENDING") {
            throw new BadRequestError("Pending orders can't be reprinted");
        }

        let reprintOrderItems: typeof order.orderItems = []

        if (reprint.orderItems) {
            reprintOrderItems = order.orderItems.filter((item) => reprint.orderItems?.some(reprintItem => reprintItem === item.id))
        }

        if (reprint.orderItems && reprintOrderItems.length !== reprint.orderItems.length) {
            throw new Error("Some order items were not found");
        }

        const ordersStations = (await prisma.$queryRaw<Array<{ stationId: string }>>`
            SELECT DISTINCT os.stationId
            FROM orders_stations_states os
            WHERE os.orderId = ${order?.id}
        `).map(({ stationId }) => stationId)

        this.printerEvent.broadcastEvent(
            {
                ...order,
                reprintOrderItems,
                reprintReceipt: reprint.reprintReceipt
            },
            "reprint-order"
        );

        return {
            ...order,
            reprintOrderItems,
            reprintReceipt: reprint.reprintReceipt
        };
    }

    async updateOrderStationStatus(orderId: string, stationId: string, status: OrderStatus) {
        return await prisma.$transaction(async tx => {
            const patchedOrderStation = await tx.orderStationStatus.update({
                where: {
                    orderId_stationId: { orderId, stationId }
                },
                data: { status }
            })

            const orderStationsStates = await tx.orderStationStatus.findMany({
                where: { orderId }
            })

            const statuses = orderStationsStates.map(oss => oss.status);
            const uniqueStatuses = new Set(statuses);

            let newOrderStatus: OrderStatus;

            if (uniqueStatuses.size === 1) {
                newOrderStatus = statuses[0];
            } else if (uniqueStatuses.has('CONFIRMED')) {
                newOrderStatus = 'PARTIAL';
            } else {
                const statusStrength = { PENDING: 0, CONFIRMED: 1, PARTIAL: 2, COMPLETED: 3, PICKED_UP: 4, CANCELLED: 5 };
                newOrderStatus = statuses.sort((a, b) => statusStrength[a as OrderStatus] - statusStrength[b as OrderStatus])[0] as OrderStatus;
            }

            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newOrderStatus,
                    completedAt: newOrderStatus === "COMPLETED" ? new Date() : null
                }
            })

            this.displayEvent.broadcastEvent(
                {
                    orderId,
                    stationId,
                    status
                },
                "order-station-status-update"
            );

            return patchedOrderStation;
        })
    }
}