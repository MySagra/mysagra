import prisma from "@/utils/prisma";

export class StatsService {
    async getOrdersStats() {
        const [total, result] = await Promise.all([
            prisma.order.count(),
            prisma.$queryRaw<
                { day: Date; count: bigint }[]
            >`
                SELECT 
                DATE(dateTime) as day,
                COUNT(*) as count
                FROM orders
                GROUP BY day
                ORDER BY day ASC
            `
        ]);

        const safeResult = result.map(r => ({
            day: r.day,
            count: Number(r.count)
        }));

        return {
            totalOrders: total,
            ordersPerDay: safeResult
        };
    }

    async getFoodsStats() {
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

        return result.map(r => ({
            food: r.food,
            quantity: Number(r.quantity),
            price: Number(r.price)
        }));
    }

    async getRevenuePerDay() {
        const result = await prisma.$queryRaw<
            { day: string; revenue: number }[]
        >`
            SELECT 
            DATE(o.dateTime) AS day,
            ROUND(SUM(fo.quantity * f.price), 2) AS revenue
            FROM orders o
            JOIN FoodsOrdered fo ON fo.orderId = o.id
            JOIN Food f ON fo.foodId = f.id
            GROUP BY day
            ORDER BY day ASC;
        `;

        return result.map(r => ({
            day: r.day,
            revenue: Number(r.revenue)
        }));
    }
}