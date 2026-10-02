import {
    ConfirmOrderInput,
    CreateOrderInput,
    GetOrdersQuery,
    OrderItemInput,
    OrderStatus,
    ReprintOrder
} from "@mysagra/schemas";

import { EventsService } from "../events/events.service";
import { prisma, Prisma } from "@mysagra/database";
import { redisConnection } from "@/lib/redis";
import { BadRequestError, NotFoundError } from "@/common/errors";
import { displayCodeGenerator } from "@/lib/displayCodeGenerator";

type Decimal = Prisma.Decimal;
type DbClient = Prisma.TransactionClient;
type DecimalInput = Decimal | number | string;

const ZERO = new Prisma.Decimal(0);

// Money columns are Decimal(10, 2): round every computed amount the same way the DB would store it.
const money = (value: DecimalInput) =>
    new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

const sum = (values: Decimal[]) => values.reduce((acc, value) => acc.add(value), ZERO);

// Ticket numbers restart every "service day", which ends at this hour (server local time).
const TICKET_RESET_HOUR = 6;
const TICKET_COUNTER_TTL_SECONDS = 2 * 24 * 60 * 60;
const ORDER_COUNTER_KEY = "order_count";
const DISPLAY_CODE_MAX_ATTEMPTS = 5;

const STATUS_RANK: Record<OrderStatus, number> = {
    PENDING: 0,
    CONFIRMED: 1,
    PARTIAL: 2,
    COMPLETED: 3,
    PICKED_UP: 4,
    CANCELLED: 5
};

const orderWithItemsInclude = {
    orderItems: {
        select: {
            id: true,
            orderId: true,
            foodId: true,
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
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderWithItemsInclude }>;

type PricedItem = {
    foodId: string;
    quantity: number;
    notes: string | null;
    unitPrice: Decimal;
    unitSurcharge: Decimal;
    total: Decimal;
};

type PricedItems = {
    items: PricedItem[];
    subTotal: Decimal;
    surcharge: Decimal;
    stationIds: string[];
};

type CancelledOrder = Prisma.OrderGetPayload<{
    include: {
        orderItems: {
            select: {
                foodId: true;
                quantity: true;
                total: true;
                food: { select: { categoryId: true; printerId: true } };
            };
        };
    };
}>;

// COMPLETED stamps the completion time, PICKED_UP keeps it, any earlier status clears it.
function completedAtFor(status: OrderStatus): Date | null | undefined {
    if (status === "COMPLETED") return new Date();
    if (status === "PICKED_UP") return undefined;
    return null;
}

function isDisplayCodeConflict(error: unknown) {
    return error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2002"
        && JSON.stringify(error.meta ?? {}).includes("displayCode");
}

export class OrdersService {
    private cashierEvent = EventsService.getInstance('cashier');
    private displayEvent = EventsService.getInstance('display');
    private printerEvent = EventsService.getInstance('printer');
    private ticketEvent = EventsService.getInstance('ticket');

    private async _getNextTicketNumber(): Promise<number> {
        const serviceDay = new Date();
        serviceDay.setHours(serviceDay.getHours() - TICKET_RESET_HOUR);

        const month = String(serviceDay.getMonth() + 1).padStart(2, "0");
        const day = String(serviceDay.getDate()).padStart(2, "0");
        const redisKey = `ticket_counter:${serviceDay.getFullYear()}-${month}-${day}`;

        const ticketNumber = await redisConnection.incr(redisKey);
        if (ticketNumber === 1) {
            // The key already changes every service day, the TTL only cleans up old counters.
            await redisConnection.expire(redisKey, TICKET_COUNTER_TTL_SECONDS);
        }

        return ticketNumber;
    }

    private async _getNextOrderNumber(): Promise<number> {
        const orderNumber = await redisConnection.incr(ORDER_COUNTER_KEY);
        if (orderNumber !== 1) return orderNumber;

        // Counter lost (e.g. Redis restart): resume after the orders already stored.
        const existingOrders = await prisma.order.count();
        return existingOrders > 0
            ? redisConnection.incrby(ORDER_COUNTER_KEY, existingOrders)
            : orderNumber;
    }

    // After a counter reset the count can fall behind the highest code used (deleted PENDING
    // orders leave gaps), so skip codes that already exist.
    private async _withDisplayCode<T>(create: (displayCode: string) => Promise<T>): Promise<T> {
        for (let attempt = 1; ; attempt++) {
            const displayCode = displayCodeGenerator.encode(await this._getNextOrderNumber());
            try {
                return await create(displayCode);
            } catch (error) {
                if (attempt >= DISPLAY_CODE_MAX_ATTEMPTS || !isDisplayCodeConflict(error)) throw error;
            }
        }
    }

    private async _priceItems(
        inputs: OrderItemInput[],
        applySurcharge: boolean,
        client: DbClient = prisma
    ): Promise<PricedItems> {
        const foodIds = [...new Set(inputs.map(item => item.foodId))];
        const foods = await client.food.findMany({
            where: { id: { in: foodIds } },
            select: { id: true, price: true, category: { select: { stationId: true } } }
        });

        const foodMap = new Map(foods.map(food => [food.id, food]));
        const missingIds = foodIds.filter(id => !foodMap.has(id));
        if (missingIds.length > 0) {
            throw new BadRequestError(`Unknown or invalid products: ${missingIds.join(", ")}`);
        }

        const stationIds = new Set<string>();
        const items = inputs.map((input): PricedItem => {
            const food = foodMap.get(input.foodId)!;
            if (food.category.stationId) stationIds.add(food.category.stationId);

            // The surcharge is given for the whole line: the total keeps it exact,
            // unitSurcharge is the rounded per-unit share.
            const lineSurcharge = applySurcharge ? money(input.surcharge) : ZERO;

            return {
                foodId: input.foodId,
                quantity: input.quantity,
                notes: input.notes || null,
                unitPrice: food.price,
                unitSurcharge: money(lineSurcharge.div(input.quantity)),
                total: money(food.price.mul(input.quantity).add(lineSurcharge))
            };
        });

        const subTotal = sum(items.map(item => item.unitPrice.mul(item.quantity)));

        return {
            items,
            subTotal,
            surcharge: sum(items.map(item => item.total)).sub(subTotal),
            stationIds: [...stationIds]
        };
    }

    private _computeTotals(subTotal: Decimal, surcharge: Decimal, discount: DecimalInput = 0) {
        const discountAmount = money(discount);
        return {
            subTotal,
            surcharge,
            discount: discountAmount,
            total: Prisma.Decimal.max(subTotal.add(surcharge).sub(discountAmount), ZERO)
        };
    }

    // Orders whose foods have no pickup station have nothing to prepare, so they complete immediately.
    private _confirmedStatus(hasStations: boolean): OrderStatus {
        return hasStations ? 'CONFIRMED' : 'COMPLETED';
    }

    private _broadcastStatusUpdate(order: { id: string; ticketNumber: number | null; displayCode: string; status: OrderStatus }) {
        EventsService.broadcastEvents(
            [this.displayEvent, this.cashierEvent, this.ticketEvent],
            {
                id: order.id,
                ticketNumber: order.ticketNumber,
                displayCode: order.displayCode,
                status: order.status
            },
            "order-status-update"
        );
    }

    private _broadcastConfirmedOrder(order: OrderWithItems, ordersStations: string[]) {
        const summary = {
            displayCode: order.displayCode,
            ticketNumber: order.ticketNumber,
            id: order.id
        };

        this.cashierEvent.broadcastEvent(summary, "confirmed-order");
        this.displayEvent.broadcastEvent({ ...summary, ordersStations }, "confirmed-order");
        EventsService.broadcastEvents([this.printerEvent, this.ticketEvent], order, "confirmed-order");

        if (order.status === 'COMPLETED') this._broadcastStatusUpdate(order);
    }

    private _deriveOrderStatus(statuses: OrderStatus[]): OrderStatus {
        const uniqueStatuses = new Set(statuses);

        if (uniqueStatuses.size === 1) return statuses[0];
        if (uniqueStatuses.has("CONFIRMED")) return "PARTIAL";

        return statuses.reduce((lowest, status) =>
            STATUS_RANK[status] < STATUS_RANK[lowest] ? status : lowest
        );
    }

    private async _updateReportsOnOrderCancellation(tx: DbClient, order: CancelledOrder) {
        if (!order.confirmedAt) return;

        const report = await tx.report.findFirst({
            where: { timestamp: { gt: order.confirmedAt } },
            orderBy: { timestamp: 'asc' },
            select: { id: true, timestamp: true, intervalInMinutes: true }
        });
        if (!report) return;

        const reportStartTime = new Date(report.timestamp.getTime() - report.intervalInMinutes * 60 * 1000);
        if (order.confirmedAt < reportStartTime) return;

        type Stat = { revenue: Decimal; quantity: number };
        const categoryStats = new Map<string, Stat & { foods: Map<string, Stat> }>();

        for (const item of order.orderItems) {
            let category = categoryStats.get(item.food.categoryId);
            if (!category) {
                category = { revenue: ZERO, quantity: 0, foods: new Map() };
                categoryStats.set(item.food.categoryId, category);
            }
            category.revenue = category.revenue.add(item.total);
            category.quantity += item.quantity;

            const food = category.foods.get(item.foodId) ?? { revenue: ZERO, quantity: 0 };
            food.revenue = food.revenue.add(item.total);
            food.quantity += item.quantity;
            category.foods.set(item.foodId, food);
        }

        const revenueDecrements = {
            totalRevenue: { decrement: order.total },
            totalCashRevenue: { decrement: order.paymentMethod === 'CASH' ? order.total : ZERO },
            totalCardRevenue: { decrement: order.paymentMethod === 'CARD' ? order.total : ZERO }
        };

        await tx.report.update({
            where: { id: report.id },
            data: { ...revenueDecrements, totalOrders: { decrement: 1 } }
        });

        if (order.cashRegisterId) {
            await tx.cashRegisterStats.updateMany({
                where: { reportId: report.id, cashRegisterId: order.cashRegisterId },
                data: revenueDecrements
            });
        }

        for (const [categoryId, category] of categoryStats) {
            await tx.categoryStats.updateMany({
                where: { reportId: report.id, categoryId },
                data: {
                    revenue: { decrement: category.revenue },
                    quantity: { decrement: category.quantity }
                }
            });

            for (const [foodId, food] of category.foods) {
                await tx.foodStats.updateMany({
                    where: { foodId, categoryStats: { reportId: report.id, categoryId } },
                    data: {
                        revenue: { decrement: food.revenue },
                        quantity: { decrement: food.quantity }
                    }
                });
            }
        }
    }

    async getOrders(queryParams: GetOrdersQuery) {
        const { limit, page, include, search } = queryParams;

        const where: Prisma.OrderWhereInput = {
            status: queryParams.status ? { in: queryParams.status } : undefined,
            displayCode: queryParams.displayCode,
            ticketNumber: queryParams.ticketNumber,
            discount: queryParams.onlyDiscounted ? { gt: 0 } : undefined
        };

        if (search) {
            const searchedTicket = Number.parseInt(search);
            where.OR = [
                { displayCode: { contains: search } },
                { table: { contains: search } },
                { customer: { contains: search } },
                ...(Number.isNaN(searchedTicket) ? [] : [{ ticketNumber: searchedTicket }])
            ];
        }

        if (queryParams.dateFrom || queryParams.dateTo) {
            where.createdAt = { gte: queryParams.dateFrom, lte: queryParams.dateTo };
        }

        const [count, orders] = await prisma.$transaction([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { [queryParams.sortBy]: 'desc' },
                include: {
                    orderStationStates: include?.includes("ordersStationsStates")
                        ? { select: { stationId: true, status: true } }
                        : false,
                    orderItems: include?.includes("items")
                        ? { omit: { orderId: true } }
                        : false
                }
            })
        ]);

        return {
            data: orders,
            pagination: {
                totalItems: count,
                currentPage: page,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    async getOrderById(id: string) {
        const order = await prisma.order.findUnique({
            where: { id },
            omit: { userId: true, cashRegisterId: true },
            include: {
                orderStationStates: { include: { station: true } },
                user: { omit: { password: true } },
                cashRegister: true,
                orderItems: {
                    orderBy: { food: { categoryId: 'asc' } },
                    omit: { orderId: true, foodId: true },
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

        if (!order) throw new NotFoundError("Order not found");

        const { orderItems, ...orderData } = order;
        const categoryMap = new Map<string, {
            category: { id: string; name: string };
            items: Array<Omit<typeof orderItems[number], "food"> & { food: object }>;
        }>();

        for (const { food, ...item } of orderItems) {
            const { category, foodIngredients, ...foodData } = food;

            let group = categoryMap.get(category.id);
            if (!group) {
                group = { category, items: [] };
                categoryMap.set(category.id, group);
            }

            group.items.push({
                ...item,
                food: { ...foodData, ingredients: foodIngredients.map(fi => fi.ingredient) }
            });
        }

        return { ...orderData, categorizedItems: [...categoryMap.values()] };
    }

    async createOrder(input: CreateOrderInput) {
        const { orderItems, confirm } = input;

        const priced = await this._priceItems(orderItems, Boolean(confirm));
        const status: OrderStatus = confirm ? this._confirmedStatus(priced.stationIds.length > 0) : 'PENDING';
        const ticketNumber = confirm ? await this._getNextTicketNumber() : null;

        const createdOrder = await this._withDisplayCode(displayCode =>
            prisma.order.create({
                data: {
                    displayCode,
                    table: input.table,
                    customer: input.customer,
                    status,
                    ticketNumber,
                    confirmedAt: confirm ? new Date() : null,
                    completedAt: completedAtFor(status),
                    paymentMethod: confirm?.paymentMethod ?? null,
                    userId: confirm?.userId ?? null,
                    cashRegisterId: confirm?.cashRegisterId ?? null,
                    ...this._computeTotals(priced.subTotal, priced.surcharge, confirm?.discount),
                    orderItems: {
                        createMany: { data: priced.items }
                    },
                    orderStationStates: {
                        createMany: { data: priced.stationIds.map(stationId => ({ stationId, status })) }
                    }
                },
                include: orderWithItemsInclude
            })
        );

        if (confirm) {
            this._broadcastConfirmedOrder(createdOrder, priced.stationIds);
        } else {
            this.cashierEvent.broadcastEvent(createdOrder, "new-order");
        }

        return {
            ...createdOrder,
            orderItems: createdOrder.orderItems.map(({ food, ...item }) => item)
        };
    }

    async confirmOrder(orderId: string, confirm: ConfirmOrderInput) {
        const { orderStationStates, ...confirmedOrder } = await prisma.$transaction(async (tx) => {
            // Claiming the order with a conditional update makes concurrent confirmations fail.
            const claimed = await tx.order.updateMany({
                where: { id: orderId, status: 'PENDING' },
                data: { status: 'CONFIRMED' }
            });

            if (claimed.count === 0) {
                const exists = await tx.order.count({ where: { id: orderId } });
                throw exists
                    ? new BadRequestError("Order is already confirmed")
                    : new NotFoundError("Order not found");
            }

            let itemsData: Pick<Prisma.OrderUpdateInput, "orderItems" | "orderStationStates">;
            let subTotal: Decimal;
            let surcharge: Decimal;
            let hasStations: boolean;

            if (confirm.orderItems?.length) {
                const priced = await this._priceItems(confirm.orderItems, true, tx);
                ({ subTotal, surcharge } = priced);
                hasStations = priced.stationIds.length > 0;
                itemsData = {
                    orderItems: {
                        deleteMany: {},
                        createMany: { data: priced.items }
                    },
                    orderStationStates: {
                        deleteMany: {},
                        createMany: {
                            data: priced.stationIds.map(stationId => ({ stationId, status: 'CONFIRMED' as const }))
                        }
                    }
                };
            } else {
                // Keep the prices snapshotted when the order was created.
                const items = await tx.orderItem.findMany({
                    where: { orderId },
                    select: { unitPrice: true, quantity: true, total: true }
                });
                subTotal = sum(items.map(item => item.unitPrice.mul(item.quantity)));
                surcharge = sum(items.map(item => item.total)).sub(subTotal);
                hasStations = await tx.orderStationStatus.count({ where: { orderId } }) > 0;
                itemsData = {
                    orderStationStates: {
                        updateMany: { where: {}, data: { status: 'CONFIRMED' } }
                    }
                };
            }

            const status = this._confirmedStatus(hasStations);

            return tx.order.update({
                where: { id: orderId },
                data: {
                    status,
                    confirmedAt: new Date(),
                    completedAt: completedAtFor(status),
                    ticketNumber: await this._getNextTicketNumber(),
                    paymentMethod: confirm.paymentMethod,
                    userId: confirm.userId,
                    cashRegisterId: confirm.cashRegisterId,
                    customer: confirm.customer,
                    table: confirm.table,
                    ...this._computeTotals(subTotal, surcharge, confirm.discount),
                    ...itemsData
                },
                include: {
                    ...orderWithItemsInclude,
                    orderStationStates: { select: { stationId: true } }
                }
            });
        });

        this._broadcastConfirmedOrder(confirmedOrder, orderStationStates.map(({ stationId }) => stationId));

        return confirmedOrder;
    }

    async updateStatus(id: string, status: OrderStatus) {
        if (status === "CANCELLED") {
            return this.deleteOrder(id);
        }

        const patchedOrder = await prisma.order.update({
            where: { id },
            data: {
                status,
                completedAt: completedAtFor(status),
                orderStationStates: {
                    updateMany: { where: {}, data: { status } }
                }
            }
        });

        this._broadcastStatusUpdate(patchedOrder);

        return patchedOrder;
    }

    async deleteOrder(id: string) {
        const cancellation = await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: {
                    orderItems: {
                        select: {
                            foodId: true,
                            quantity: true,
                            total: true,
                            food: { select: { categoryId: true, printerId: true } }
                        }
                    }
                }
            });

            if (!order) throw new NotFoundError("Order not found");
            if (order.status === "CANCELLED") throw new BadRequestError("Order is already cancelled");

            if (order.status === "PENDING") {
                await tx.order.delete({ where: { id } });
                return null;
            }

            await this._updateReportsOnOrderCancellation(tx, order);

            const cancelledOrder = await tx.order.update({
                where: { id },
                data: {
                    status: "CANCELLED",
                    orderStationStates: {
                        updateMany: { where: {}, data: { status: "CANCELLED" } }
                    }
                }
            });

            const printers = new Set(order.orderItems.map(item => item.food.printerId));
            printers.delete(null);

            return { cancelledOrder, printers: [...printers] };
        });

        if (!cancellation) return null;

        const { cancelledOrder, printers } = cancellation;

        EventsService.broadcastEvents(
            [this.displayEvent, this.cashierEvent, this.ticketEvent],
            {
                id,
                ticketNumber: cancelledOrder.ticketNumber,
                displayCode: cancelledOrder.displayCode,
                status: cancelledOrder.status
            },
            "order-cancelled"
        );

        this.printerEvent.broadcastEvent(
            {
                orderId: id,
                ticketNumber: cancelledOrder.ticketNumber,
                displayCode: cancelledOrder.displayCode,
                customer: cancelledOrder.customer,
                table: cancelledOrder.table,
                status: cancelledOrder.status,
                printers
            },
            "order-cancelled"
        );

        return cancelledOrder;
    }

    async reprintOrder(id: string, reprint: ReprintOrder) {
        const result = await prisma.order.findUnique({
            where: { id },
            include: {
                ...orderWithItemsInclude,
                orderStationStates: { select: { stationId: true } }
            }
        });

        if (!result) throw new NotFoundError("Order not found");
        if (result.status === "PENDING") throw new BadRequestError("Pending orders can't be reprinted");

        const { orderStationStates, ...order } = result;

        const requestedIds = new Set(reprint.orderItems ?? []);
        const reprintOrderItems = order.orderItems.filter(item => requestedIds.has(item.id));

        if (reprintOrderItems.length !== requestedIds.size) {
            throw new BadRequestError("Some order items were not found");
        }

        const reprinted = {
            ...order,
            reprintOrderItems,
            reprintReceipt: reprint.reprintReceipt
        };

        this.printerEvent.broadcastEvent(
            {
                ...reprinted,
                ordersStations: orderStationStates.map(({ stationId }) => stationId)
            },
            "reprint-order"
        );

        return reprinted;
    }

    async updateOrderStationStatus(orderId: string, stationId: string, status: OrderStatus) {
        const { patched: patchedOrderStation, updatedOrder } = await prisma.$transaction(async tx => {
            const patched = await tx.orderStationStatus.update({
                where: { orderId_stationId: { orderId, stationId } },
                data: { status }
            });

            const stationStates = await tx.orderStationStatus.findMany({
                where: { orderId },
                select: { status: true }
            });
            const orderStatus = this._deriveOrderStatus(stationStates.map(state => state.status));

            const order = await tx.order.findUniqueOrThrow({
                where: { id: orderId },
                select: { status: true }
            });

            // Only touch the order when its status really changes, so completedAt is not re-stamped.
            if (order.status === orderStatus) return { patched, updatedOrder: null };

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status: orderStatus, completedAt: completedAtFor(orderStatus) }
            });

            return { patched, updatedOrder };
        });

        EventsService.broadcastEvents(
            [this.displayEvent, this.ticketEvent],
            { orderId, stationId, status },
            "order-station-status-update"
        )

        if (updatedOrder) this._broadcastStatusUpdate(updatedOrder);

        return patchedOrderStation;
    }
}
