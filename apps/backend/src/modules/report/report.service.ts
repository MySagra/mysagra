import { Prisma, prisma } from "@mysagra/database"
import { sagraService } from "../sagra/sagra.service"
import { OrderStats, CategoryStats, FoodStats } from "@mysagra/schemas"
import { GetReportsQuery, GroupInterval } from "@mysagra/schemas"

export class ReportService {
    private static instance: ReportService

    private constructor() { }

    static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService()
        }
        return ReportService.instance
    }

    async generateReport() {
        const now = new Date()

        return await prisma.$transaction(async (tx) => {
            const lastReport = await tx.report.findFirst({
                orderBy: {
                    timestamp: "desc"
                }
            })

            const defaultInterval = sagraService.getConfig()?.statsIntervalMinutes || 60;

            // Determine the start time and actual interval for stats generation
            let startTime: Date
            let actualInterval: number

            if (lastReport) {
                // Generate stats from last report to now
                startTime = lastReport.timestamp
                actualInterval = Math.round((now.getTime() - lastReport.timestamp.getTime()) / 60000)
            } else {
                // Generate stats from defaultInterval minutes ago to now
                startTime = new Date(now.getTime() - defaultInterval * 60000)
                actualInterval = defaultInterval
            }

            const [orderStatsRaw, categoryStatsRaw, foodStatsRaw] = await Promise.all([
                this._generateOrderStats(tx, startTime, now),
                this._generateCategoryStats(tx, startTime, now),
                this._generateFoodStats(tx, startTime, now),
            ])

            const orderStats: OrderStats = orderStatsRaw[0];

            const report = await tx.report.create({
                data: {
                    timestamp: now,
                    intervalInMinutes: actualInterval,
                    totalRevenue: this._round(Number(orderStats.totalRevenue)),
                    totalCashRevenue: this._round(Number(orderStats.totalCashRevenue)),
                    totalCardRevenue: this._round(Number(orderStats.totalCardRevenue)),
                    totalOrders: Number(orderStats.totalOrders), // Convert BigInt to Number
                    averageCompletitionTime: Math.round(orderStats.averageCompletitionTime || 0),

                    categoryStats: {
                        create: categoryStatsRaw.map((c: any) => ({
                            categoryId: c.categoryId,
                            categoryName: c.categoryName,
                            revenue: this._round(Number(c.revenue)),
                            quantity: Number(c.quantity),
                            foodStats: {
                                create: foodStatsRaw
                                    .filter((f: any) => f.categoryId === c.categoryId)
                                    .map((f: any) => ({
                                        foodId: f.foodId,
                                        foodName: f.foodName,
                                        revenue: this._round(Number(f.revenue)),
                                        quantity: Number(f.quantity)
                                    }))
                            }
                        }))
                    }
                }
            })
            return report;
        })
    }

    private _round(value: number | string): number {
        return Math.round(Number(value) * 100) / 100;
    }

    private async _generateOrderStats(tx: Prisma.TransactionClient, from: Date, to: Date): Promise<OrderStats[]> {
        return await tx.$queryRaw
            `
                SELECT
                ${to} as timestamp,
                CEIL((UNIX_TIMESTAMP(${to}) - UNIX_TIMESTAMP(${from})) / 60) as intervalInMinutes,
                IFNULL(SUM(oi.total), 0) as totalRevenue,
                IFNULL(SUM(IF(o.paymentMethod = 'CASH', oi.total, 0)), 0) as totalCashRevenue,
                IFNULL(SUM(IF(o.paymentMethod = 'CARD', oi.total, 0)), 0) as totalCardRevenue,
                COUNT(DISTINCT o.id) as totalOrders,
                IFNULL(AVG((UNIX_TIMESTAMP(o.completedAt) - UNIX_TIMESTAMP(o.createdAt)) * 1000), 0) as averageCompletitionTime
                FROM orders o
                INNER JOIN order_items oi ON o.id = oi.orderId
                WHERE o.status = 'COMPLETED'
                AND o.completedAt >= ${from}
                AND o.completedAt < ${to};
            `
    }

    private async _generateCategoryStats(tx: Prisma.TransactionClient, from: Date, to: Date): Promise<CategoryStats[]> {
        return await tx.$queryRaw
            `
                SELECT
                c.id as categoryId,
                c.name as categoryName,
                IFNULL(SUM(oi.total), 0) as revenue,
                IFNULL(SUM(oi.quantity), 0) as quantity
                FROM categories c
                INNER JOIN foods f ON c.id = f.categoryId
                INNER JOIN order_items oi ON f.id = oi.foodId
                INNER JOIN orders o ON oi.orderId = o.id
                WHERE o.status = 'COMPLETED'
                AND o.completedAt >= ${from}
                AND o.completedAt < ${to}
                GROUP BY c.id, c.name;
            `
    }

    private async _generateFoodStats(tx: Prisma.TransactionClient, from: Date, to: Date): Promise<FoodStats[]> {
        return await tx.$queryRaw
            `
                SELECT
                f.id as foodId,
                f.name as foodName,
                c.id as categoryId,
                IFNULL(SUM(oi.total), 0) as revenue,
                IFNULL(SUM(oi.quantity), 0) as quantity
                FROM foods f
                INNER JOIN order_items oi ON f.id = oi.foodId
                INNER JOIN orders o ON oi.orderId = o.id
                INNER JOIN categories c ON f.categoryId = c.id
                WHERE o.status = 'COMPLETED'
                AND o.completedAt >= ${from}
                AND o.completedAt < ${to}
                GROUP BY f.id, f.name;
            `
    }

    async getReports(query: GetReportsQuery) {
        const reports = await prisma.report.findMany({
            where: {
                timestamp: {
                    gte: query.from,
                    lte: query.to
                }
            },
            include: {
                categoryStats: {
                    include: {
                        foodStats: true
                    }
                }
            },
            orderBy: { timestamp: 'asc' }
        })

        if (query.groupBy === '1h') return reports;

        const grouped = reports.reduce((acc: any, report) => {
            // Generate a bucket key based on the interval
            const bucketKey = this._getBucketKey(report.timestamp, query.groupBy);

            if (!acc[bucketKey]) {
                acc[bucketKey] = {
                    timestamp: bucketKey,
                    totalRevenue: 0,
                    totalOrders: 0,
                    totalCompletionTimeWeight: 0, // Used for weighted average
                    categoryStats: {}
                };
            }

            const b = acc[bucketKey];
            b.totalRevenue += Number(report.totalRevenue);
            b.totalOrders += Number(report.totalOrders);

            // Weighted average for completion time: (avg1 * count1 + avg2 * count2) / totalCount
            b.totalCompletionTimeWeight += (Number(report.averageCompletitionTime) * Number(report.totalOrders));

            // Group nested categories
            report.categoryStats.forEach(cat => {
                if (!b.categoryStats[cat.categoryId]) {
                    b.categoryStats[cat.categoryId] = { ...cat, foodStats: {} };
                } else {
                    b.categoryStats[cat.categoryId].revenue += Number(cat.revenue);
                    b.categoryStats[cat.categoryId].quantity += cat.quantity;
                }

                // Group nested foods
                cat.foodStats.forEach(food => {
                    const foodMap = b.categoryStats[cat.categoryId].foodStats;
                    if (!foodMap[food.foodId]) {
                        foodMap[food.foodId] = { ...food };
                    } else {
                        foodMap[food.foodId].revenue += Number(food.revenue);
                        foodMap[food.foodId].quantity += food.quantity;
                    }
                });
            });

            return acc;
        }, {});

        // 3. Finalize and format (convert maps back to arrays)
        return Object.values(grouped).map((b: any) => ({
            ...b,
            averageCompletitionTime: b.totalOrders > 0 ? Math.round(b.totalCompletionTimeWeight / b.totalOrders) : 0,
            categoryStats: Object.values(b.categoryStats).map((c: any) => ({
                ...c,
                foodStats: Object.values(c.foodStats)
            }))
        }));
    }

    private _getBucketKey(date: Date, interval: GroupInterval): string {
        const d = new Date(date);
        d.setMinutes(0, 0, 0); // Reset minutes/seconds

        switch (interval) {
            case 'day':
                d.setHours(0);
                return d.toISOString();
            case '4h':
                const hour4 = Math.floor(d.getHours() / 4) * 4;
                d.setHours(hour4);
                return d.toISOString();
            case 'all':
                return "summary";
            default:
                return d.toISOString();
        }
    }

    async getReport(id: string) {
        return await prisma.report.findUnique({
            where: {
                id
            },
            include: {
                categoryStats: {
                    include: {
                        foodStats: true
                    }
                }
            }
        })
    }

}

export const reportService = ReportService.getInstance()