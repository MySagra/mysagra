import { NextFunction, Request, Response } from "express";
import { FoodsOrdered, Order } from "@generated/prisma_client/client";
import generateOrderId from "@/lib/idGenerator";

import prisma from "@/utils/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

export const getOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { page } = req.params;

    const take = 21;
    const skip = (parseInt(page) - 1) * take;

    const totalOrders = await prisma.order.count()

    const orders = await prisma.order.findMany({
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
    });

    const totalPages = Math.ceil(totalOrders / take);
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.status(200).json({
        orders,
        pagination: {
            currentPage: page,
            totalPages,
            totalItems: totalOrders,
            itemsPerPage: take,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? parseInt(page) + 1 : null,
            prevPage: hasPrevPage ? parseInt(page) - 1 : null
        }
    });
})

export const getDailyOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const orders = await prisma.order.findMany({
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

    if (orders.length === 0) {
        res.status(404).json({ message: "Daily orders not found" });
        return;
    }
    res.status(200).json(orders);
})

export const getOrderById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id;

    const order = await prisma.order.findUnique({
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
                            category: true
                        }
                    }
                }
            }
        },

    });

    if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
    }

    res.status(200).json(order);
})

export const searchOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const value = req.params.value;

    const orders = await prisma.order.findMany({
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

    if (orders.length === 0) {
        res.status(404).json({ message: "Order not found" });
        return;
    }

    res.status(200).json(orders);
});

export const searchDailyOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const value = req.params.value;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const orders = await prisma.order.findMany({
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

    if (orders.length === 0) {
        res.status(404).json({ message: "Order not found" });
        return;
    }

    res.status(200).json(orders);
});

export const createOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const order: Order = req.body;
    const foodsOrdereds: Array<FoodsOrdered> = req.body.foodsOrdered;

    let price = 0;
    for (const foodOrder of foodsOrdereds) {
        const food = await prisma.food.findUnique({ where: { id: foodOrder.foodId } })
        if (!food) {
            res.status(400).json({
                error: "Food not exists"
            })
            return;
        }

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
        data: foodsOrdereds.map(foodsOrdered => ({ quantity: foodsOrdered.quantity, foodId: foodsOrdered.foodId, orderId: newOrder.id }))
    })

    const fullOrder = await prisma.order.findFirst({
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

    res.status(201).json(fullOrder);
});

export const deleteOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const id = req.params.id;

    await prisma.order.delete({
        where: {
            id
        }
    });

    res.status(200).json({
        message: "Order deleted"
    });
});