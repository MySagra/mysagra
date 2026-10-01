import { Prisma, prisma } from "@mysagra/database"
import { sagraService } from "../sagra/sagra.service"
import { OrderStats, CategoryStats, FoodStats, GeneralClosureInput } from "@mysagra/schemas"
import { GetReportsQuery, GroupInterval } from "@mysagra/schemas"
import { logger } from "@/config/logger"
import { EventsService } from "../events/events.service"
import { BadRequestError } from "@/common/errors"

const reportWithStatsInclude = {
    categoryStats: { include: { foodStats: true } },
    cashRegisterStats: true
} satisfies Prisma.ReportInclude

type ReportWithStats = Prisma.ReportGetPayload<{ include: typeof reportWithStatsInclude }>

const ZERO = new Prisma.Decimal(0)

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
            from = await prisma.confirmedOrder.findFirst({
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
                    totalRevenue: this._money(orderStats.totalRevenue),
                    totalCashRevenue: this._money(orderStats.totalCashRevenue),
                    totalCardRevenue: this._money(orderStats.totalCardRevenue),
                    totalOrders: Number(orderStats.totalOrders), // Convert BigInt to Number
                    averageCompletionTime: orderStats.averageCompletionTime != null ? Math.round(Number(orderStats.averageCompletionTime)) : null,

                    categoryStats: {
                        create: categoryStatsRaw.map((c: any) => ({
                            categoryId: c.categoryId,
                            categoryName: c.categoryName,
                            revenue: this._money(c.revenue),
                            quantity: Number(c.quantity),
                            foodStats: {
                                create: foodStatsRaw
                                    .filter((f: any) => f.categoryId === c.categoryId)
                                    .map((f: any) => ({
                                        foodId: f.foodId,
                                        foodName: f.foodName,
                                        revenue: this._money(f.revenue),
                                        quantity: Number(f.quantity)
                                    }))
                            }
                        }))
                    },
                    cashRegisterStats: {
                        create: cashRegisterStatsRaw.map((cr: any) => ({
                            cashRegisterId: cr.cashRegisterId,
                            cashRegisterName: cr.cashRegisterName,
                            totalRevenue: this._money(cr.totalRevenue),
                            totalCardRevenue: this._money(cr.totalCardRevenue),
                            totalCashRevenue: this._money(cr.totalCashRevenue)
                        }))
                    }
                }
            })
            return report;
        })
    }

    // Money columns are Decimal(10, 2): raw SUM() results are rounded the same way.
    private _money(value: Prisma.Decimal | string | number): Prisma.Decimal {
        return new Prisma.Decimal(value).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }

    // `timestamp` stores the END of the interval; the report logically belongs to
    // its START: timestamp - intervalInMinutes.
    private _getReportStart(report: { timestamp: Date; intervalInMinutes: number }): Date {
        return new Date(report.timestamp.getTime() - report.intervalInMinutes * 60000);
    }

    private async _generateOrderStats(tx: Prisma.TransactionClient, from: Date, to: Date): Promise<OrderStats[]> {
        return await tx.$queryRaw
            `
                SELECT
                ${to} as timestamp,
                CEIL((UNIX_TIMESTAMP(${to}) - UNIX_TIMESTAMP(${from})) / 60) as intervalInMinutes,
                IFNULL(SUM(co.total), 0) as totalRevenue,
                IFNULL(SUM(IF(co.paymentMethod = 'CASH', co.total, 0)), 0) as totalCashRevenue,
                IFNULL(SUM(IF(co.paymentMethod = 'CARD', co.total, 0)), 0) as totalCardRevenue,
                COUNT(DISTINCT o.id) as totalOrders,
                AVG(IF(co.completedAt IS NOT NULL, (UNIX_TIMESTAMP(co.completedAt) - UNIX_TIMESTAMP(o.createdAt)) * 1000, NULL)) as averageCompletionTime
                FROM orders o
                INNER JOIN confirmed_orders co ON co.orderId = o.id
                WHERE o.status IN ('CONFIRMED', 'PARTIAL', 'PICKED_UP', 'COMPLETED')
                AND co.confirmedAt >= ${from}
                AND co.confirmedAt < ${to};
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
                INNER JOIN confirmed_orders co ON co.orderId = o.id
                WHERE o.status IN ('CONFIRMED', 'PARTIAL', 'PICKED_UP', 'COMPLETED')
                AND co.confirmedAt >= ${from}
                AND co.confirmedAt < ${to}
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
                INNER JOIN confirmed_orders co ON co.orderId = o.id
                INNER JOIN categories c ON f.categoryId = c.id
                WHERE o.status IN ('CONFIRMED', 'PARTIAL', 'PICKED_UP', 'COMPLETED')
                AND co.confirmedAt >= ${from}
                AND co.confirmedAt < ${to}
                GROUP BY f.id, f.name;
            `
    }

    private async _generateCashRegisterStats(tx: Prisma.TransactionClient, from: Date, to: Date): Promise<any[]> {
        return await tx.$queryRaw
            `
                SELECT
                cr.id as cashRegisterId,
                cr.name as cashRegisterName,
                IFNULL(SUM(co.total), 0) as totalRevenue,
                IFNULL(SUM(IF(co.paymentMethod = 'CARD', co.total, 0)), 0) as totalCardRevenue,
                IFNULL(SUM(IF(co.paymentMethod = 'CASH', co.total, 0)), 0) as totalCashRevenue
                FROM cash_registers cr
                LEFT JOIN confirmed_orders co ON cr.id = co.cashRegisterId
                LEFT JOIN orders o ON o.id = co.orderId
                WHERE o.status IN ('CONFIRMED', 'PARTIAL', 'PICKED_UP', 'COMPLETED')
                AND co.confirmedAt >= ${from}
                AND co.confirmedAt < ${to}
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

    private _formatRealtimeReport(realtimeStats: any, timestamp: Date): ReportWithStats | null {
        const orderStats = realtimeStats.orderStats;

        // Only include real-time data if there are orders
        if (!orderStats || Number(orderStats.totalOrders) === 0) {
            return null;
        }

        const reportId = `realtime-${timestamp.getTime()}`;

        return {
            id: reportId,
            timestamp: timestamp,
            intervalInMinutes: Number(orderStats.intervalInMinutes),
            totalRevenue: this._money(orderStats.totalRevenue),
            totalCashRevenue: this._money(orderStats.totalCashRevenue),
            totalCardRevenue: this._money(orderStats.totalCardRevenue),
            totalOrders: Number(orderStats.totalOrders),
            averageCompletionTime: orderStats.averageCompletionTime ? Math.round(Number(orderStats.averageCompletionTime)) : null,
            categoryStats: realtimeStats.categoryStatsRaw.map((c: any) => ({
                id: `realtime-cat-${c.categoryId}`,
                reportId,
                categoryId: c.categoryId,
                categoryName: c.categoryName,
                revenue: this._money(c.revenue),
                quantity: Number(c.quantity),
                foodStats: realtimeStats.foodStatsRaw
                    .filter((f: any) => f.categoryId === c.categoryId)
                    .map((f: any) => ({
                        id: `realtime-food-${f.foodId}`,
                        categoryStatsId: `realtime-cat-${c.categoryId}`,
                        foodId: f.foodId,
                        foodName: f.foodName,
                        revenue: this._money(f.revenue),
                        quantity: Number(f.quantity)
                    }))
            })),
            cashRegisterStats: realtimeStats.cashRegisterStatsRaw.map((cr: any) => ({
                id: `realtime-cr-${cr.cashRegisterId}`,
                reportId,
                cashRegisterId: cr.cashRegisterId,
                cashRegisterName: cr.cashRegisterName,
                totalRevenue: this._money(cr.totalRevenue),
                totalCardRevenue: this._money(cr.totalCardRevenue),
                totalCashRevenue: this._money(cr.totalCashRevenue)
            }))
        };
    }

    // Adds a stored report into an aggregation bucket, merging stats by category, food and cash register.
    private _mergeIntoBucket(bucket: ReportWithStats, report: ReportWithStats) {
        bucket.totalRevenue = bucket.totalRevenue.add(report.totalRevenue);
        bucket.totalCashRevenue = bucket.totalCashRevenue.add(report.totalCashRevenue);
        bucket.totalCardRevenue = bucket.totalCardRevenue.add(report.totalCardRevenue);
        bucket.totalOrders += report.totalOrders;

        for (const catStat of report.categoryStats) {
            let category = bucket.categoryStats.find(c => c.categoryId === catStat.categoryId);
            if (!category) {
                category = { ...catStat, revenue: ZERO, quantity: 0, foodStats: [] };
                bucket.categoryStats.push(category);
            }
            category.revenue = category.revenue.add(catStat.revenue);
            category.quantity += catStat.quantity;

            for (const foodStat of catStat.foodStats) {
                let food = category.foodStats.find(f => f.foodId === foodStat.foodId);
                if (!food) {
                    food = { ...foodStat, revenue: ZERO, quantity: 0 };
                    category.foodStats.push(food);
                }
                food.revenue = food.revenue.add(foodStat.revenue);
                food.quantity += foodStat.quantity;
            }
        }

        for (const crStat of report.cashRegisterStats) {
            let cashRegister = bucket.cashRegisterStats.find(cr => cr.cashRegisterId === crStat.cashRegisterId);
            if (!cashRegister) {
                cashRegister = { ...crStat, totalRevenue: ZERO, totalCardRevenue: ZERO, totalCashRevenue: ZERO };
                bucket.cashRegisterStats.push(cashRegister);
            }
            cashRegister.totalRevenue = cashRegister.totalRevenue.add(crStat.totalRevenue);
            cashRegister.totalCardRevenue = cashRegister.totalCardRevenue.add(crStat.totalCardRevenue);
            cashRegister.totalCashRevenue = cashRegister.totalCashRevenue.add(crStat.totalCashRevenue);
        }
    }

    async getReports(query: GetReportsQuery, saveLiveData = false): Promise<ReportWithStats[]> {
        if (!query.to) {
            query.to = new Date()
        }

        // Widen the fetch (start = timestamp - interval implies timestamp > from),
        // then filter in JS on the effective start time.
        const rawReportsRaw = await prisma.report.findMany({
            where: {
                timestamp: {
                    gt: query.from
                }
            },
            include: reportWithStatsInclude,
            orderBy: { timestamp: 'asc' }
        });

        const rawReports = rawReportsRaw.filter((r) => {
            const start = this._getReportStart(r);
            return start >= query.from && start <= query.to!;
        });

        // Get real-time stats for current interval
        const realtimeStats = await this._getRealTimeStats(query.from, query.to, saveLiveData);
        const realtimeBucket = this._formatRealtimeReport(realtimeStats, new Date());

        if (query.groupBy === '1h') {
            const shifted = rawReports.map((r) => ({
                ...r,
                timestamp: this._getReportStart(r)
            }));
            return realtimeBucket ? [...shifted, realtimeBucket] : shifted;
        }

        const buckets = new Map<number, ReportWithStats>();
        const bucketCompletionTimeWeighted = new Map<number, number>();

        // Process only raw reports for aggregation (exclude real-time from aggregation)
        for (const report of rawReports) {
            const bucketKey = this.getBucketTimestamp(this._getReportStart(report), query.groupBy);

            let bucket = buckets.get(bucketKey);
            if (!bucket) {
                bucket = {
                    id: bucketKey.toString(),
                    timestamp: new Date(bucketKey),
                    totalRevenue: ZERO,
                    totalCashRevenue: ZERO,
                    totalCardRevenue: ZERO,
                    totalOrders: 0,
                    averageCompletionTime: null,
                    categoryStats: [],
                    cashRegisterStats: [],
                    intervalInMinutes: bucketKey
                };
                buckets.set(bucketKey, bucket);
            }

            this._mergeIntoBucket(bucket, report);

            // Weighted average for completion time
            bucketCompletionTimeWeighted.set(
                bucketKey,
                (bucketCompletionTimeWeighted.get(bucketKey) || 0) + ((report.averageCompletionTime || 0) * report.totalOrders)
            );
        }

        const aggregatedReports = Array.from(buckets.values())
            .map(bucket => {
                const weightedTotal = bucketCompletionTimeWeighted.get(bucket.timestamp.getTime());
                bucket.averageCompletionTime = bucket.totalOrders > 0 && weightedTotal
                    ? Math.round(weightedTotal / bucket.totalOrders)
                    : null;
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
            include: reportWithStatsInclude
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