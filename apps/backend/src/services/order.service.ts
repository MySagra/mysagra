import prisma from "@/utils/prisma";
import z from 'zod'
import { ConfirmedOrder, Order, OrderExclude, orderSchema } from "@/schemas";
import { generateDisplayId } from "@/lib/idGenerator";

import { ConfirmedOrderService } from "./confirmedOrder.service";
import { EventService } from "./event.service";

import { Prisma } from "@/generated/prisma_client";
import { PrismaClient } from "@prisma/client";

export class OrderService {
    private cashierEvent = EventService.getIstance('cashier');

    async getOrders(page: number) {
        const take = 21;
        const skip = (page - 1) * take;

        const [totalOrders, orders] = await Promise.all([
            await prisma.order.count(),
            await prisma.order.findMany({
                take,
                skip,
                orderBy: {
                    createdAt: "desc"
                }
            })
        ]);

        const totalOrdersPages = Math.ceil(totalOrders / take);
        const hasNextPage = page < totalOrdersPages;
        const hasPrevPage = page > 1;

        return {
            orders,
            pagination: {
                currentPage: page,
                totalOrdersPages,
                totalOrdersItems: totalOrders,
                itemsPerPage: take,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null
            }
        }
    }

    async getDailyOrders(exclude?: OrderExclude) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const whereClause: Prisma.OrderWhereInput = {
            createdAt: {
                gte: today,
                lt: tomorrow
            }
        }

        if (exclude === 'confirmed') {
            whereClause.confirmedOrder = null;
        }

        console.log("Using where clause:", JSON.stringify(whereClause, null, 2));

        return await prisma.order.findMany({
            where: whereClause,
            orderBy: {
                createdAt: "desc"
            }
        });
    }

    async getOrderByCode(code: string) {
        const order = await prisma.order.findUnique({
            where: {
                displayCode: code
            },
            include: {
                orderItems: {
                    omit: {
                        orderId: true,
                        foodId: true
                    },
                    include: {
                        food: {
                            omit: {
                                categoryId: true
                            },
                            include: {
                                category: {
                                    select: {
                                        id: true,
                                        name: true
                                    }
                                },
                                foodIngredients: {
                                    select: {
                                        ingredient: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!order) return null;

        const itemsByCategory = order.orderItems.reduce((acc, item) => {
            const categoryName = item.food.category.name;

            if (!acc[categoryName]) {
                acc[categoryName] = {
                    category: item.food.category,
                    items: []
                };
            }

            const { foodIngredients, ...foodData } = item.food;
            const ingredients = foodIngredients.map(fi => fi.ingredient);

            acc[categoryName].items.push({
                ...item,
                food: {
                    ...foodData,
                    ingredients
                }
            });

            return acc;
        }, {} as Record<string, { category: any, items: any[] }>);

        const categorizedItems = Object.values(itemsByCategory);

        return {
            ...order,
            orderItems: undefined,
            categorizedItems
        };
    }

    async searchOrder(value: string) {
        return await prisma.order.findMany({
            where: {
                OR: [
                    { displayCode: value },
                    { table: { contains: value } },
                    { customer: { contains: value } }
                ]
            }
        });
    }

    async searchDailyOrder(value: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                OR: [
                    { displayCode: value },
                    { table: { contains: value } },
                    { customer: { contains: value } }
                ]
            }
        });
    }

    async createOrder(order: Order, tx?: Prisma.TransactionClient) {
        let newOrder;
        if (!tx) {
            newOrder = await prisma.$transaction(async (tx) => {
                return await this._createOrderLogic(order, tx);
            })
            this.cashierEvent.broadcastEvent(newOrder, "new-order")
        }
        else{
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