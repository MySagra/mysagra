import { Prisma, prisma } from "@mysagra/database"
import { sagraService } from "../sagra/sagra.service"
import { OrderStats, CategoryStats, FoodStats } from "@mysagra/schemas"
import { GetReportsQuery, GroupInterval } from "@mysagra/schemas"
import { Report } from "@mysagra/schemas"

export class ReportService {
    private static instance: ReportService

    private constructor() { }

    static getInstance(): ReportService {
        if (!ReportService.instance) {
            const instance = new ReportService()
            ReportService.instance = instance
            instance.initReports();
        }
        return ReportService.instance
    }

    private async initReports() {
        const lastReport = await prisma.report.findFirst({
            orderBy: { timestamp: "desc" }
        })

        let from;
        const to = new Date();

        if (!lastReport) {
            from = await prisma.order.findFirst({
                where: { NOT: { completedAt: null } },
                orderBy: { completedAt: "asc" }
            }).then(async (order) => {
                return order?.completedAt
            })
            if (!from) return; // no orders for report generation
        }
        else {
            from = lastReport.timestamp
        }

        const interval = (sagraService.getConfig()?.statsIntervalMinutes || 60) * 60 * 1000
        let currentStep = new Date(from.getTime() + interval);

        while (currentStep <= to) {
            await this.generateReport(new Date(currentStep));
            currentStep = new Date(currentStep.getTime() + interval);
        }
    }

    async generateReport(to = new Date()) {
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
                actualInterval = Math.round((to.getTime() - lastReport.timestamp.getTime()) / 60000)

                if (lastReport.totalOrders === 0) {
                    await tx.report.delete({
                        where: { id: lastReport.id }
                    })
                }
            } else {
                // Generate stats from defaultInterval minutes ago to now
                startTime = new Date(to.getTime() - defaultInterval * 60000)
                actualInterval = defaultInterval
            }

            const [orderStatsRaw, categoryStatsRaw, foodStatsRaw] = await Promise.all([
                this._generateOrderStats(tx, startTime, to),
                this._generateCategoryStats(tx, startTime, to),
                this._generateFoodStats(tx, startTime, to),
            ])

            const orderStats: OrderStats = orderStatsRaw[0];

            const report = await tx.report.create({
                data: {
                    timestamp: to,
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

    private getBucketTimestamp(date: Date, interval: GroupInterval): number {
        const d = new Date(date);
        d.setMinutes(0, 0, 0);

        switch (interval) {
            case '1h':
                d.setMinutes(0, 0, 0);
                break;
            case '4h':
                const hours4 = Math.floor(d.getHours() / 4) * 4;
                d.setHours(hours4, 0, 0, 0);
                break;
            case '12h':
                const hours12 = Math.floor(d.getHours() / 12) * 12;
                d.setHours(hours12, 0, 0, 0);
                break;
            case 'day':
                d.setHours(0, 0, 0, 0);
                break;
            case 'all':
                return 0; // Everything goes into a single bucket
        }

        return d.getTime();
    }

    async getReports(query: GetReportsQuery) {
        const rawReports = await prisma.report.findMany({
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
        });

        if (query.groupBy === '1h') {
            return rawReports;
        }

        const buckets = new Map<number, Report>();
        const bucketCompletitionTimeWeighted = new Map<number, number>();

        for (const report of rawReports) {
            const bucketKey = this.getBucketTimestamp(report.timestamp, query.groupBy);

            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, {
                    id: bucketKey.toString(),
                    timestamp: new Date(bucketKey),
                    totalRevenue: 0,
                    totalCashRevenue: 0,
                    totalCardRevenue: 0,
                    totalOrders: 0,
                    categoryStats: [],
                    intervalInMinutes: bucketKey
                })
                bucketCompletitionTimeWeighted.set(bucketKey, 0);
            }

            const currentBucket = buckets.get(bucketKey);

            if(!currentBucket) continue;

            // Sum all totals
            currentBucket.totalRevenue += Number(report.totalRevenue);
            currentBucket.totalCashRevenue += Number(report.totalCashRevenue);
            currentBucket.totalCardRevenue += Number(report.totalCardRevenue);
            currentBucket.totalOrders += report.totalOrders;

            // Weighted average for completion time
            bucketCompletitionTimeWeighted.set(
                bucketKey,
                (bucketCompletitionTimeWeighted.get(bucketKey) || 0) + ((report.averageCompletitionTime || 0) * report.totalOrders)
            );

            // Aggregate categoryStats
            const categoryStatsMap = new Map<string, any>();

            // Initialize with existing categoryStats from bucket
            for (const catStat of currentBucket.categoryStats) {
                categoryStatsMap.set(catStat.categoryId, {
                    id: catStat.id,
                    reportId: catStat.reportId,
                    categoryId: catStat.categoryId,
                    categoryName: catStat.categoryName,
                    revenue: Number(catStat.revenue),
                    quantity: catStat.quantity,
                    foodStats: [...catStat.foodStats]
                });
            }

            // Aggregate from current report
            for (const catStat of report.categoryStats) {
                if (!categoryStatsMap.has(catStat.categoryId)) {
                    categoryStatsMap.set(catStat.categoryId, {
                        id: catStat.id,
                        reportId: catStat.reportId,
                        categoryId: catStat.categoryId,
                        categoryName: catStat.categoryName,
                        revenue: 0,
                        quantity: 0,
                        foodStats: []
                    });
                }

                const aggregatedCategory = categoryStatsMap.get(catStat.categoryId)!;
                aggregatedCategory.revenue += Number(catStat.revenue);
                aggregatedCategory.quantity += catStat.quantity;

                // Aggregate foodStats within category
                const foodStatsMap = new Map<string, any>();

                for (const foodStat of aggregatedCategory.foodStats) {
                    foodStatsMap.set(foodStat.foodId, {
                        id: foodStat.id,
                        categoryStatsId: foodStat.categoryStatsId,
                        foodId: foodStat.foodId,
                        foodName: foodStat.foodName,
                        revenue: Number(foodStat.revenue),
                        quantity: foodStat.quantity
                    });
                }

                for (const foodStat of catStat.foodStats) {
                    if (!foodStatsMap.has(foodStat.foodId)) {
                        foodStatsMap.set(foodStat.foodId, {
                            id: foodStat.id,
                            categoryStatsId: foodStat.categoryStatsId,
                            foodId: foodStat.foodId,
                            foodName: foodStat.foodName,
                            revenue: 0,
                            quantity: 0
                        });
                    }

                    const aggregatedFood = foodStatsMap.get(foodStat.foodId)!;
                    aggregatedFood.revenue += Number(foodStat.revenue);
                    aggregatedFood.quantity += foodStat.quantity;
                }

                aggregatedCategory.foodStats = Array.from(foodStatsMap.values());
            }

            currentBucket.categoryStats = Array.from(categoryStatsMap.values());
        }

        return Array.from(buckets.values())
            .map(bucket => {
                if (bucket.totalOrders > 0) {
                    const weightedTotal = bucketCompletitionTimeWeighted.get(bucket.timestamp.getTime());
                    bucket.averageCompletitionTime = weightedTotal ? Math.round(weightedTotal / bucket.totalOrders) : undefined;
                } else {
                    bucket.averageCompletitionTime = undefined;
                }
                return bucket;
            })
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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