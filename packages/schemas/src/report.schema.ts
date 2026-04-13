import { z } from "zod"

export const GroupIntervalSchema = z.enum(["1h", "4h", "12h", "day", "all"])

export const GetReportsQuerySchema = z.object({
  from: z.coerce.date().describe("Start date and time (ISO 8601 format)"),
  to: z.coerce.date().describe("End date and time (ISO 8601 format)"),
  groupBy: GroupIntervalSchema
})

export type GroupInterval = z.infer<typeof GroupIntervalSchema>
export type GetReportsQuery = z.infer<typeof GetReportsQuerySchema>

export const OrderStatsSchema = z.object({
  timestamp: z.date(),
  intervalInMinutes: z.number(),
  totalRevenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  totalCashRevenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  totalCardRevenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  totalOrders: z.number(),
  averageCompletitionTime: z.number().nullable().optional()
})

export type OrderStats = z.infer<typeof OrderStatsSchema>


export const FoodStatsSchema = z.object({
  id: z.string(),
  categoryStatsId: z.string(),
  foodId: z.string(),
  foodName: z.string(),
  revenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  quantity: z.number()
})

export type FoodStats = z.infer<typeof FoodStatsSchema>

export const CategoryStatsSchema = z.object({
  id: z.string(),
  reportId: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  revenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  quantity: z.number(),
  foodStats: z.array(FoodStatsSchema)
})

export type CategoryStats = z.infer<typeof CategoryStatsSchema>

export const ReportSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  intervalInMinutes: z.number(),
  totalRevenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  totalCashRevenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  totalCardRevenue: z.union([z.number(), z.string()]).transform(val => Number(val)),
  totalOrders: z.number(),
  averageCompletitionTime: z.number().nullable().optional(),
  categoryStats: z.array(CategoryStatsSchema)
})

export type Report = z.infer<typeof ReportSchema>

export const GetStatsResponseSchema = z.array(ReportSchema)

export type GetStatsResponse = z.infer<typeof GetStatsResponseSchema>
