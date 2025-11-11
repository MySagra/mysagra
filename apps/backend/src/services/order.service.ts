import prisma from "@/utils/prisma";
import z from 'zod'
import { ConfirmedOrder, Order, OrderExclude, OrderQuery, orderSchema } from "@/schemas";
import { generateDisplayId } from "@/lib/idGenerator";
import { EventService } from "./event.service";

import { Prisma } from "@/generated/prisma_client";

export class OrderService {
    private cashierEvent = EventService.getIstance('cashier');

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

        if (queryParams.confirmed === false) {
            where.confirmedOrder = null;
        }
        else if (queryParams.status) {
            where.confirmedOrder = {
                status: {
                    in: queryParams.status
                }
            }
        }
        else if (queryParams.confirmed === true) {
            where.confirmedOrder = {
                isNot: null
            };
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

    async getOrderByCode(code: string) {
        const order = await prisma.order.findUnique({
            where: {
                displayCode: code
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

    async createOrder(order: Order, tx?: Prisma.TransactionClient) {
        let newOrder;
        if (!tx) {
            newOrder = await prisma.$transaction(async (tx) => {
                return await this._createOrderLogic(order, tx);
            })
            this.cashierEvent.broadcastEvent(newOrder, "new-order")
        }
        else {
            newOrder = await this._createOrderLogic(order, tx);
        }
        return newOrder;
    }

    private async _createOrderLogic(order: Order, tx: Prisma.TransactionClient) {
        const { orderItems } = order;

        const foodIds = orderItems.map(item => item.foodId);

        const foods = await tx.food.findMany({
            where: { id: { in: foodIds } },
            select: { id: true, price: true }
        });

        const foodPriceMap = new Map(foods.map(f => [f.id, f.price]));
        const price = orderItems.reduce((total, item) => {
            const foodPrice = foodPriceMap.get(item.foodId);
            return total + (foodPrice ? Number(foodPrice) * item.quantity : 0);
        }, 0);

        const createdOrder = await tx.order.create({
            data: {
                table: order.table.toString(),
                customer: order.customer,
                subTotal: price.toFixed(2)
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
    }

    async deleteOrder(code: string) {
        await prisma.order.delete({
            where: {
                displayCode: code
            }
        });
        return null;
    }
}