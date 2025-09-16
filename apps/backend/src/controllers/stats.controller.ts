import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { StatsService } from "@/services/stats.service";

export class StatsController {
  constructor(private statsService: StatsService) { }
  getOrdersStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await this.statsService.getOrdersStats();
    res.status(200).json(stats);
  });

  getFoodsStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await this.statsService.getFoodsStats();
    res.status(200).json(stats);
  });

  getRevenuePerDay = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await this.statsService.getRevenuePerDay();
    res.status(200).json(stats);
  });
}