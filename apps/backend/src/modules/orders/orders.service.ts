import {
    Channel,
    ConfirmOrderInput,
    CreateOrderInput,
    EventName,
    GetOrdersQuery,
    OrderItem,
    OrderStatus,
    ReprintOrder
} from "@mysagra/schemas";

import { EventsService } from "../events/events.service";
import { prisma, Prisma } from "@mysagra/database";
import { redisConnection } from "@/lib/redis";
import { BadRequestError, NotFoundError } from "@/common/errors";

import { displayCodeGenerator } from "@/lib/displayCodeGenerator";
import { flattenOrder } from "./orders.mapper";

// items returned together with a created/confirmed order (printers and tickets need food and station)
const orderItemsWithFood = {
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
} satisfies Prisma.Order$orderItemsArgs;

export class OrdersService {
    private cashierEvent = EventsService.getInstance('cashier');
    private displayEvent = EventsService.getInstance('display');
    private printerEvent = EventsService.getInstance('printer');
    private ticketEvent = EventsService.getInstance('ticket');

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

    // same food with same notes becomes a single row (unique orderId + foodId + notes)
    private _mergeOrderItems<T extends { foodId: string; quantity: number; notes?: string | null; surcharge: number }>(items: T[]): T[] {
        const merged = new Map<string, T>();

        for (const item of items) {
            const notes = item.notes ?? "";
            const key = `${item.foodId}|${notes}`;
            const existing = merged.get(key);

            if (existing) {
                existing.quantity += item.quantity;
                existing.surcharge += item.surcharge;
            } else {
                merged.set(key, { ...item, notes });
            }
        }

        return Array.from(merged.values());
    }

    // station states exist only for confirmed orders
    private async _createStationStates(tx: Prisma.TransactionClient, orderId: string, status: OrderStatus) {
        const stationIds = await tx.$queryRaw<Array<{ stationId: string }>>`
            SELECT DISTINCT s.id as stationId
            FROM order_items oi
            JOIN foods f ON oi.foodId = f.id
            JOIN categories c ON c.id = f.categoryId
            JOIN stations s ON s.id = c.stationId
            WHERE oi.orderId = ${orderId}
        `

        await tx.orderStationStatus.createMany({
            data: stationIds.map(({ stationId }) => ({
                orderId,
                stationId,
                status
            }))
        })
    }

    private async _updateReportsOnOrderCancellation(tx: Prisma.TransactionClient, orderId: string) {
        const order = await tx.order.findUnique({
            where: { id: orderId },
            include: {
                confirmedOrder: true,
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

        const confirmation = order?.confirmedOrder;
        if (!order || !confirmation) return;

        const affectedReport = await tx.report.findFirst({
            where: {
                timestamp: {
                    gt: confirmation.confirmedAt
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
        if (confirmation.confirmedAt < reportStartTime) return;

        const orderTotal = Number(confirmation.total);
        const orderCashRevenue = confirmation.paymentMethod === 'CASH' ? orderTotal : 0;
        const orderCardRevenue = confirmation.paymentMethod === 'CARD' ? orderTotal : 0;

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
            if (confirmation.cashRegisterId !== crStat.cashRegisterId) {
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

    async getOrders(queryParams: GetOrdersQuery) {
        const { limit, page, include } = queryParams;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {};
        const confirmedWhere: Prisma.ConfirmedOrderWhereInput = {};

        if (queryParams.onlyDiscounted) {
            confirmedWhere.discount = { gt: 0 }
        }

        if (queryParams.search) {
            where.OR = [
                { displayCode: { contains: queryParams.search } },
                { table: { contains: queryParams.search } },
                { customer: { contains: queryParams.search } },
                ...(!isNaN(parseInt(queryParams.search))
                    ? [{ confirmedOrder: { is: { ticketNumber: { equals: parseInt(queryParams.search) } } } }]
                    : [])
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

        if (queryParams.ticketNumber) {
            confirmedWhere.ticketNumber = queryParams.ticketNumber
        }

        if (Object.keys(confirmedWhere).length > 0) {
            where.confirmedOrder = { is: confirmedWhere }
        }

        const includeStationStates = !!include?.includes("ordersStationsStates");
        const orderBy: Prisma.OrderOrderByWithRelationInput = queryParams.sortBy === 'createdAt'
            ? { createdAt: 'desc' }
            : { confirmedOrder: { [queryParams.sortBy]: 'desc' } };

        const query = await prisma.$transaction(async (tx) => {
            const count = await tx.order.count({
                where: where
            });
            const orders = await tx.order.findMany({
                where: where,
                skip: skip,
                take: limit,
                orderBy,
                include: {
                    confirmedOrder: {
                        include: {
                            orderStationStates: includeStationStates ? {
                                select: {
                                    stationId: true,
                                    status: true
                                }
                            } : false
                        }
                    },
                    orderItems: include?.includes("items") ? {
                        omit: { orderId: true }
                    } : false
                }
            })
            return {
                count,
                orders
            }
        })

        return {
            data: query.orders.map(order => {
                const flat = flattenOrder(order);
                return includeStationStates ? { orderStationStates: [], ...flat } : flat;
            }),
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
                confirmedOrder: {
                    omit: { userId: true, cashRegisterId: true },
                    include: {
                        orderStationStates: { include: { station: true } },
                        user: { omit: { password: true } },
                        cashRegister: true
                    }
                },
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
        return {
            orderStationStates: [],
            user: null,
            cashRegister: null,
            ...flattenOrder(orderBaseData),
            categorizedItems: Array.from(categoryMap.values())
        };
    }

    async createOrder(order: CreateOrderInput) {
        const { confirm } = order;
        const orderItems = this._mergeOrderItems(order.orderItems);

        const createdOrder = await prisma.$transaction(async (tx) => {
            const foodIds = orderItems.map(item => item.foodId);
            const foods = await tx.food.findMany({
                where: { id: { in: foodIds } },
                select: { id: true, price: true }
            });

            const foundIds = new Set(foods.map(f => f.id));
            const missingIds = [...new Set(foodIds)].filter(id => !foundIds.has(id));

            if (missingIds.length > 0) {
                throw new BadRequestError(
                    `Unknown or invalid products: ${missingIds.join(", ")}`
                );
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

            let confirmedOrder: Prisma.ConfirmedOrderCreateWithoutOrderInput | undefined;

            if (confirm) {
                const discount = new Prisma.Decimal(confirm.discount || 0);
                let total = subTotal.add(totalSurcharge).sub(discount);

                if (total.isNegative()) total = new Prisma.Decimal(0);

                confirmedOrder = {
                    ticketNumber: await this._getNextTicketNumber(),
                    paymentMethod: confirm.paymentMethod,
                    discount: discount,
                    total: total,
                    user: confirm.userId ? { connect: { id: confirm.userId } } : undefined,
                    cashRegister: { connect: { id: confirm.cashRegisterId } }
                }
            }

            const createdOrder = await tx.order.create({
                data: {
                    table: order.table ?? null,
                    customer: order.customer ?? null,
                    subTotal: subTotal,
                    surcharge: totalSurcharge,
                    displayCode: displayCodeGenerator.encode(await this._getOrderCount()),
                    status: confirm ? 'CONFIRMED' : 'PENDING',
                    confirmedOrder: confirmedOrder ? { create: confirmedOrder } : undefined
                },
            });

            //create order items
            await tx.orderItem.createMany({
                data: createOrderItems.map(item => ({
                    orderId: createdOrder.id,
                    foodId: item.foodId,
                    quantity: item.quantity,
                    notes: item.notes ?? "",
                    unitPrice: item.unitPrice!,
                    unitSurcharge: item.surcharge / item.quantity,
                    total: item.total!
                }))
            });

            if (confirm) {
                await this._createStationStates(tx, createdOrder.id, 'CONFIRMED');
            }

            const fullOrder = await tx.order.findUniqueOrThrow({
                where: { id: createdOrder.id },
                include: {
                    confirmedOrder: true,
                    orderItems: orderItemsWithFood
                }
            });

            return flattenOrder(fullOrder);
        })

        if (confirm) {
            this.cashierEvent.broadcastEvent(
                {
                    displayCode: createdOrder.displayCode,
                    ticketNumber: createdOrder.ticketNumber,
                    id: createdOrder.id
                },
                "confirmed-order"
            )

            const ordersStations = (await prisma.$queryRaw<Array<{ stationId: string }>>`
                SELECT DISTINCT os.stationId
                FROM orders_stations_states os
                WHERE os.orderId = ${createdOrder.id}
            `).map(({ stationId }) => stationId)

            this.displayEvent.broadcastEvent(
                {
                    displayCode: createdOrder.displayCode,
                    ticketNumber: createdOrder.ticketNumber,
                    id: createdOrder.id,
                    ordersStations
                },
                "confirmed-order"
            )

            EventsService.broadcastEvents(
                [this.printerEvent, this.ticketEvent],
                createdOrder,
                "confirmed-order"
            );
        }

        // cashier only event
        if (!confirm) {
            this.cashierEvent.broadcastEvent(createdOrder, "new-order")
        }

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
                include: { confirmedOrder: true, orderItems: { include: { food: true } } }
            });

            if (!existingOrder) throw new Error("Order not found");
            if (existingOrder.status !== 'PENDING' || existingOrder.confirmedOrder) throw new Error("Order is already confirmed");

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

                this._mergeOrderItems(confirm.orderItems).forEach(item => {
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
                        notes: item.notes ?? "",
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

            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CONFIRMED',
                    surcharge: totalSurcharge,
                    subTotal: subTotal,
                    customer: confirm.customer,
                    table: confirm.table,
                    confirmedOrder: {
                        create: {
                            ticketNumber: await this._getNextTicketNumber(),
                            paymentMethod: confirm.paymentMethod,
                            discount: discount,
                            total: total,
                            user: confirm.userId ? { connect: { id: confirm.userId } } : undefined,
                            cashRegister: { connect: { id: confirm.cashRegisterId } }
                        }
                    }
                }
            });

            await this._createStationStates(tx, orderId, 'CONFIRMED');

            const updatedOrder = await tx.order.findUniqueOrThrow({
                where: { id: orderId },
                include: {
                    confirmedOrder: true,
                    orderItems: orderItemsWithFood
                }
            });

            return flattenOrder(updatedOrder);
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
            WHERE os.orderId = ${confirmedOrder.id}
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

        EventsService.broadcastEvents(
            [this.printerEvent, this.ticketEvent],
            confirmedOrder,
            "confirmed-order"
        )

        return confirmedOrder;
    }

    async updateStatus(id: string, status: OrderStatus) {
        if (status == "CANCELLED") {
            return await this.deleteOrder(id)
        }

        const patchedOrder = await prisma.$transaction(async tx => {
            const existing = await tx.order.findUnique({
                where: { id },
                select: { confirmedOrder: { select: { orderId: true } } }
            });

            if (!existing) throw new NotFoundError("Order not found");

            // PENDING <=> no confirmation data
            const isConfirmed = !!existing.confirmedOrder;
            if (isConfirmed === (status === "PENDING")) {
                throw new BadRequestError(isConfirmed
                    ? "A confirmed order can't go back to PENDING"
                    : "Pending orders must be confirmed first");
            }

            const order = await tx.order.update({
                where: { id },
                data: {
                    status,
                    confirmedOrder: isConfirmed ? {
                        update: { completedAt: status === "COMPLETED" ? new Date() : null }
                    } : undefined
                },
                include: { confirmedOrder: true }
            })

            await tx.orderStationStatus.updateMany({
                where: { orderId: order.id },
                data: { status }
            })

            return flattenOrder(order);
        })
        EventsService.broadcastEvents(
            [this.displayEvent, this.cashierEvent, this.ticketEvent],
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
                select: { status: true }
            });

            if (!order) return null;

            if (order.status !== "PENDING") {
                await this._updateReportsOnOrderCancellation(tx, id);

                const updatedOrder = flattenOrder(await tx.order.update({
                    where: { id },
                    data: { status: "CANCELLED" },
                    include: { confirmedOrder: true }
                }));

                await tx.orderStationStatus.updateMany({
                    where: { orderId: id },
                    data: { status: "CANCELLED" }
                })

                // Select all distinct printers in an order
                const printers: { printerId: string }[] = await tx.$queryRaw
                    `
                    SELECT DISTINCT f.printerId
                    FROM order_items oi
                    JOIN foods f ON oi.foodId = f.id
                    WHERE oi.orderId = ${id}
                `
                const printerIds = printers.map(p => p.printerId)

                EventsService.broadcastEvents(
                    [this.displayEvent, this.cashierEvent, this.ticketEvent],
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
        const foundOrder = await prisma.order.findUnique({
            where: {
                id
            },
            include: {
                confirmedOrder: true,
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

        if (!foundOrder) {
            throw new NotFoundError("Order not found")
        }

        const order = flattenOrder(foundOrder);

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
            WHERE os.orderId = ${order.id}
        `).map(({ stationId }) => stationId)

        this.printerEvent.broadcastEvent(
            {
                ...order,
                reprintOrderItems,
                reprintReceipt: reprint.reprintReceipt,
                ordersStations
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

            // station states exist only for confirmed orders, so the confirmation row is always there
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: newOrderStatus,
                    confirmedOrder: {
                        update: { completedAt: newOrderStatus === "COMPLETED" ? new Date() : null }
                    }
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
