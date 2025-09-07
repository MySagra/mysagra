import { NextFunction, Request, Response } from "express";

import prisma from "@/utils/prisma";
import { asyncHandler } from "@/utils/asyncHandler";

export const getOrdersStat = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const total = await prisma.order.count()

  const result = await prisma.$queryRaw<
    { day: Date; count: bigint }[]
  >`
    SELECT 
      DATE(dateTime) as day, 
      COUNT(*) as count
    FROM orders
    GROUP BY day
    ORDER BY day ASC
  `;

  const safeResult = result.map(r => ({
    day: r.day,
    count: Number(r.count)
  }));

  res.status(200).json({
    totalOrders: total,
    ordersPerDay: safeResult
  });

})

export const getFoodsStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const result = await prisma.$queryRaw<
    { food: string; quantity: number; price: number }[]
  >`
    SELECT 
      f.name AS food,
      SUM(fo.quantity) AS quantity,
      SUM(fo.quantity * f.price) AS price
    FROM FoodsOrdered fo
    JOIN Food f ON fo.foodId = f.id
    GROUP BY f.name
    ORDER BY quantity DESC;
  `;

  result.map(r => ({
    food: r.food,
    quantity: Number(r.quantity),
    price: Number(r.price)
  }));

  res.status(200).json({
    foodOrdered: result
  });
});

export const getRevenuePerDay = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const result = await prisma.$queryRaw<
    { day: string; revenue: number }[]
  >`
    SELECT 
      DATE(o.dateTime) AS day,
      SUM(fo.quantity * f.price) AS revenue
    FROM orders o
    JOIN FoodsOrdered fo ON fo.orderId = o.id
    JOIN Food f ON fo.foodId = f.id
    GROUP BY day
    ORDER BY day ASC;
  `;

  const safeResult = result.map(r => ({
    day: r.day,
    revenue: Number(r.revenue)
  }));

  res.status(200).json({
    revenuePerDay: safeResult
  });
});