import prisma from "@/utils/prisma";
import z from 'zod'
import { orderSchema } from "@/validators";
import generateOrderId from "@/lib/idGenerator";

export class OrderService {
    async getOrders(page: number) {
        const take = 21;
        const skip = (page - 1) * take;

        const [totalOrders, orders] = await Promise.all([
            await prisma.order.count(),
            await prisma.order.findMany({
                take,
                skip,
                include: {
                    foodsOrdered: {
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
                                    category: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    dateTime: "desc"
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

    async getDailyOrders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        return await prisma.order.findMany({
            where: {
                dateTime: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                foodsOrdered: {
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
                                category: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                dateTime: "desc"
            }
        });
    }

    async getOrderById(id: string) {
        return await prisma.order.findUnique({
            where: {
                id
            },
            include: {
                foodsOrdered: {
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
                                category: true,
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
    }

    async searchOrder(value: string) {
        return await prisma.order.findMany({
            where: {
                OR: [
                    { id: value },
                    { table: { contains: value } },
                    { customer: { contains: value } }
                ]
            },
            include: {
                foodsOrdered: {
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
                                category: true
                            }
                        }
                    }
                }
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
                dateTime: {
                    gte: today,
                    lt: tomorrow
                },
                OR: [
                    { id: value },
                    { table: { contains: value } },
                    { customer: { contains: value } }
                ]
            },
            include: {
                foodsOrdered: {
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
                                category: true
                            }
                        }
                    }
                }
            }
        });
    }

    async createOrder(order: z.infer<typeof orderSchema>) {

        const { foodsOrdered } = order;

        let price = 0;
        for (const foodOrder of foodsOrdered) {
            const food = await prisma.food.findUnique({ where: { id: foodOrder.foodId } })
            if (!food) continue;

            price += Number(food?.price ?? 0) * Number(foodOrder.quantity);
        }

        const newOrder = await prisma.order.create({
            data: {
                id: await generateOrderId(),
                table: order.table.toString(),
                customer: order.customer,
                price: price.toFixed(2).toString()
            }
        });

        await prisma.foodsOrdered.createMany({
            data: foodsOrdered.map(foodOrdered => ({ quantity: foodOrdered.quantity, foodId: foodOrdered.foodId, orderId: newOrder.id }))
        });

        return await prisma.order.findUnique({
            where: {
                id: newOrder.id
            },
            include: {
                foodsOrdered: {
                    include: {
                        food: true
                    }
                }
            }
        })
    }

    async deleteOrder(id: string) {
        await prisma.order.delete({
            where: {
                id
            }
        });

        return null;
    }
}