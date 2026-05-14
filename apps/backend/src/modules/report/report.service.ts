import { Prisma, prisma } from "@mysagra/database"
import { sagraService } from "../sagra/sagra.service"
import { OrderStats, CategoryStats, FoodStats, GeneralClosureInput } from "@mysagra/schemas"
import { GetReportsQuery, GroupInterval } from "@mysagra/schemas"
import { Report } from "@mysagra/schemas"
import { logger } from "@/config/logger"
import { EventsService } from "../events/events.service"
import { BadRequestError } from "@/common/errors"

export class ReportService {
    private static instance: ReportService
    private printerEvent = EventsService.getInstance('printer');

    private constructor() { }

    static getInstance(): ReportService {
        if (!ReportService.instance) {
            ReportService.instance = new ReportService()
        }
        return ReportService.instance
    }

    async initReports() {
        const lastReport = await prisma.report.findFirst({
            orderBy: { timestamp: "desc" }
        })

        let from;
        const to = new Date();

        if (!lastReport) {
            from = await prisma.order.findFirst({
                where: { NOT: { confirmedAt: null } },
                orderBy: { confirmedAt: "asc" }
            }).then(async (order) => {
                return order?.confirmedAt
            })
            if (!from) return; // no orders for report generation
        }
        else {
            from = lastReport.timestamp
        }

        const interval = (sagraService.getConfig()?.statsIntervalMinutes || 60) * 60 * 1000
        let currentStep = new Date(from.getTime() + interval);

        logger.info(`Started report generation from: ${from}`)

        while (currentStep <= to) {
            await this.generateReport(new Date(currentStep));
            currentStep = new Date(currentStep.getTime() + interval);
        }

        logger.info("Finished report generation")
    }

    async generateReport(to = new Date(), saveData = true) {
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

                if (lastReport.totalOrders === 0 && saveData) {
                    await tx.report.delete({
                        where: { id: lastReport.id }
                    })
                }
            } else {
                // Generate stats from defaultInterval minutes ago to now
                startTime = new Date(to.getTime() - defaultInterval * 60000)
                actualInterval = defaultInterval
            }

            const [orderStatsRaw, categoryStatsRaw, foodStatsRaw, cashRegisterStatsRaw] = await Promise.all([
                this._generateOrderStats(tx, startTime, to),
                this._generateCategoryStats(tx, startTime, to),
                this._generateFoodStats(tx, startTime, to),
                this._generateCashRegisterStats(tx, startTime, to),
            ])
            
            if (!saveData) {
                return {
                    orderStats: orderStatsRaw[0],
                    categoryStatsRaw,
                    foodStatsRaw,
                    cashRegisterStatsRaw
                }
            }

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
                    },
                    cashRegisterStats: {
                        create: cashRegisterStatsRaw.map((cr: any) => ({
                            cashRegisterId: cr.cashRegisterId,
                            cashRegisterName: cr.cashRegisterName,
                            totalRevenue: this._round(Number(cr.totalRevenue)),
                            totalCardRevenue: this._round(Number(cr.totalCardRevenue)),
                            totalCashRevenue: this._round(Number(cr.totalCashRevenue))
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
                IFNULL(SUM(o.total), 0) as totalRevenue,
                IFNULL(SUM(IF(o.paymentMethod = 'CASH', o.total, 0)), 0) as totalCashRevenue,
                IFNULL(SUM(IF(o.paymentMethod = 'CARD', o.total, 0)), 0) as totalCardRevenue,
                COUNT(DISTINCT o.id) as totalOrders,
                IFNULL(AVG(IF(o.completedAt IS NOT NULL, (UNIX_TIMESTAMP(o.completedAt) - UNIX_TIMESTAMP(o.createdAt)) * 1000, NULL)), 0) as averageCompletitionTime
                FROM orders o
                WHERE o.status IN ('CONFIRMED', 'PICKED_UP', 'COMPLETED')
                AND o.confirmedAt >= ${from}
                AND o.confirmedAt < ${to};
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
                WHERE o.status IN ('CONFIRMED', 'PICKED_UP', 'COMPLETED')
                AND o.confirmedAt >= ${from}
                AND o.confirmedAt < ${to}
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
                WHERE o.status IN ('CONFIRMED', 'PICKED_UP', 'COMPLETED')
                AND o.confirmedAt >= ${from}
                AND o.confirmedAt < ${to}
                GROUP BY f.id, f.name;
            `
    }

    private async _generateCashRegisterStats(tx: Prisma.TransactionClient, from: Date, to: Date): Promise<any[]> {
        return await tx.$queryRaw
            `
                SELECT
                cr.id as cashRegisterId,
                cr.name as cashRegisterName,
                IFNULL(SUM(o.total), 0) as totalRevenue,
                IFNULL(SUM(IF(o.paymentMethod = 'CARD', o.total, 0)), 0) as totalCardRevenue,
                IFNULL(SUM(IF(o.paymentMethod = 'CASH', o.total, 0)), 0) as totalCashRevenue
                FROM cash_registers cr
                LEFT JOIN orders o ON cr.id = o.cashRegisterId
                WHERE o.status IN ('CONFIRMED', 'PICKED_UP', 'COMPLETED')
                AND o.confirmedAt >= ${from}
                AND o.confirmedAt < ${to}
                GROUP BY cr.id, cr.name;
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

    private async _getRealTimeStats(from: Date, to: Date, saveLiveData = false) {
        const realtimeData = await this.generateReport(to, saveLiveData) as any;

        return {
            orderStats: realtimeData.orderStats,
            categoryStatsRaw: realtimeData.categoryStatsRaw,
            foodStatsRaw: realtimeData.foodStatsRaw,
            cashRegisterStatsRaw: realtimeData.cashRegisterStatsRaw
        };
    }

    private _formatRealtimeReport(realtimeStats: any, timestamp: Date, interval: string): Report | null {
        const orderStats = realtimeStats.orderStats;

        // Only include real-time data if there are orders
        if (!orderStats || Number(orderStats.totalOrders) === 0) {
            return null;
        }

        const report: Report = {
            id: `realtime-${timestamp.getTime()}`,
            timestamp: timestamp,
            intervalInMinutes: Number(orderStats.intervalInMinutes),
            totalRevenue: this._round(Number(orderStats.totalRevenue)),
            totalCashRevenue: this._round(Number(orderStats.totalCashRevenue)),
            totalCardRevenue: this._round(Number(orderStats.totalCardRevenue)),
            totalOrders: Number(orderStats.totalOrders),
            averageCompletitionTime: orderStats.averageCompletitionTime ? Math.round(Number(orderStats.averageCompletitionTime)) : undefined,
            categoryStats: realtimeStats.categoryStatsRaw.map((c: any) => ({
                id: `realtime-cat-${c.categoryId}`,
                reportId: `realtime-${timestamp.getTime()}`,
                categoryId: c.categoryId,
                categoryName: c.categoryName,
                revenue: this._round(Number(c.revenue)),
                quantity: Number(c.quantity),
                foodStats: realtimeStats.foodStatsRaw
                    .filter((f: any) => f.categoryId === c.categoryId)
                    .map((f: any) => ({
                        id: `realtime-food-${f.foodId}`,
                        categoryStatsId: `realtime-cat-${c.categoryId}`,
                        foodId: f.foodId,
                        foodName: f.foodName,
                        revenue: this._round(Number(f.revenue)),
                        quantity: Number(f.quantity)
                    }))
            })),
            cashRegisterStats: realtimeStats.cashRegisterStatsRaw.map((cr: any) => ({
                id: `realtime-cr-${cr.cashRegisterId}`,
                reportId: `realtime-${timestamp.getTime()}`,
                cashRegisterId: cr.cashRegisterId,
                cashRegisterName: cr.cashRegisterName,
                totalRevenue: this._round(Number(cr.totalRevenue)),
                totalCardRevenue: this._round(Number(cr.totalCardRevenue)),
                totalCashRevenue: this._round(Number(cr.totalCashRevenue))
            }))
        };

        return report;
    }

    async getReports(query: GetReportsQuery, saveLiveData = false) {
        if (!query.to) {
            query.to = new Date()
        }

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
                },
                cashRegisterStats: true
            },
            orderBy: { timestamp: 'asc' }
        });

        // Get real-time stats for current interval
        const realtimeStats = await this._getRealTimeStats(query.from, query.to, saveLiveData);
        const realtimeBucket = this._formatRealtimeReport(realtimeStats, new Date(), query.groupBy);

        if (query.groupBy === '1h') {
            // For 1h grouping, append real-time data
            return realtimeBucket ? [...rawReports, realtimeBucket] : rawReports;
        }

        const buckets = new Map<number, Report>();
        const bucketCompletitionTimeWeighted = new Map<number, number>();

        // Process only raw reports for aggregation (exclude real-time from aggregation)
        const reportsToProcess = rawReports;

        for (const report of reportsToProcess) {
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
                    cashRegisterStats: [],
                    intervalInMinutes: bucketKey
                })
                bucketCompletitionTimeWeighted.set(bucketKey, 0);
            }

            const currentBucket = buckets.get(bucketKey);

            if (!currentBucket) continue;

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

            // Aggregate cashRegisterStats
            const cashRegisterStatsMap = new Map<string, any>();

            // Initialize with existing cashRegisterStats from bucket
            for (const crStat of currentBucket.cashRegisterStats) {
                cashRegisterStatsMap.set(crStat.cashRegisterId, {
                    id: crStat.id,
                    reportId: crStat.reportId,
                    cashRegisterId: crStat.cashRegisterId,
                    cashRegisterName: crStat.cashRegisterName,
                    totalRevenue: Number(crStat.totalRevenue),
                    totalCardRevenue: Number(crStat.totalCardRevenue),
                    totalCashRevenue: Number(crStat.totalCashRevenue)
                });
            }

            // Aggregate from current report
            for (const crStat of report.cashRegisterStats) {
                if (!cashRegisterStatsMap.has(crStat.cashRegisterId)) {
                    cashRegisterStatsMap.set(crStat.cashRegisterId, {
                        id: crStat.id,
                        reportId: crStat.reportId,
                        cashRegisterId: crStat.cashRegisterId,
                        cashRegisterName: crStat.cashRegisterName,
                        totalRevenue: 0,
                        totalCardRevenue: 0,
                        totalCashRevenue: 0
                    });
                }

                const aggregatedCR = cashRegisterStatsMap.get(crStat.cashRegisterId)!;
                aggregatedCR.totalRevenue += Number(crStat.totalRevenue);
                aggregatedCR.totalCardRevenue += Number(crStat.totalCardRevenue);
                aggregatedCR.totalCashRevenue += Number(crStat.totalCashRevenue);
            }

            currentBucket.cashRegisterStats = Array.from(cashRegisterStatsMap.values());
        }

        const aggregatedReports = Array.from(buckets.values())
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

        // Append real-time data at the end
        return realtimeBucket ? [...aggregatedReports, realtimeBucket] : aggregatedReports;
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
                },
                cashRegisterStats: true
            }
        })
    }

    async generalClosure(data: GeneralClosureInput) {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0);

        if (now.getHours() < 7) {
            from.setDate(from.getDate() - 1);
        }

        if (!await prisma.cashRegister.findUnique({ where: { id: data.cashRegister } })) {
            throw new BadRequestError(`Cash register with CUID: ${data.cashRegister} doesn't exists`)
        }

        await this.generateReport(now);

        const report = await this.getReports({
            from,
            groupBy: 'all'
        }, false)

        report[0].timestamp = now

        this.printerEvent.broadcastEvent(
            {
                cashRegister: data.cashRegister,
                report: report[0]
            },
            "general-closure"
        )

        return report;
    }
}

export const reportService = ReportService.getInstance()