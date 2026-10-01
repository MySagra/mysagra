import { z } from "zod";
import {
  CashRegisterStatsSchema,
  CategoryResponseSchema,
  CategoryStatsSchema,
  FoodResponseSchema,
  FoodStatsSchema,
  IngredientResponseSchema,
  ReportSchema,
  StationResponseSchema,
} from "@mysagra/schemas";

// The API sends money values as decimal strings; the dashboard only displays,
// sorts and charts them, so they are parsed to numbers once, when a response arrives.
const money = z.coerce.number();

export const IngredientSchema = IngredientResponseSchema.extend({
  surcharge: money,
});

export const FoodSchema = FoodResponseSchema.extend({
  price: money,
  ingredients: z.array(IngredientSchema).nullish(),
});

export const CategorySchema = CategoryResponseSchema.extend({
  foods: z.array(FoodSchema).optional(),
});

export const StationSchema = StationResponseSchema.extend({
  categories: z.array(CategorySchema).optional(),
});

export const FoodStatsNumberSchema = FoodStatsSchema.extend({
  revenue: money,
});

export const CategoryStatsNumberSchema = CategoryStatsSchema.extend({
  revenue: money,
  foodStats: z.array(FoodStatsNumberSchema),
});

export const CashRegisterStatsNumberSchema = CashRegisterStatsSchema.extend({
  totalRevenue: money,
  totalCardRevenue: money,
  totalCashRevenue: money,
});

export const ReportNumberSchema = ReportSchema.extend({
  totalRevenue: money,
  totalCashRevenue: money,
  totalCardRevenue: money,
  categoryStats: z.array(CategoryStatsNumberSchema),
  cashRegisterStats: z.array(CashRegisterStatsNumberSchema),
});

export const GetStatsResponseSchema = z.array(ReportNumberSchema);

export type FoodStats = z.infer<typeof FoodStatsNumberSchema>;
export type CategoryStats = z.infer<typeof CategoryStatsNumberSchema>;
export type CashRegisterStats = z.infer<typeof CashRegisterStatsNumberSchema>;
export type Report = z.infer<typeof ReportNumberSchema>;
export type GetStatsResponse = z.infer<typeof GetStatsResponseSchema>;
