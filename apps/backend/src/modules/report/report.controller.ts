import { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { TypedRequest } from "@/types/request";
import { CUIDParam, GeneralClosureInput, GetReportsQuery } from "@mysagra/schemas";
import { reportService } from "./report.service";
import { NotFoundError } from "@/common/errors";

export class ReportController {
    private static instance: ReportController
    private static service = reportService

    private constructor() { }

    static getInstance() {
        if (!ReportController.instance) {
            ReportController.instance = new ReportController()
        }
        return ReportController.instance
    }

    getReports = asyncHandler(async (
        req: TypedRequest<{ query: GetReportsQuery }>,
        res: Response,
    ): Promise<void> => {
        const reports = await ReportController.service.getReports(req.validated.query)
        res.status(200).json(reports);
    });

    getReport = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const report = await ReportController.service.getReport(req.validated.params.id)
        if(!report) {
            throw new NotFoundError("Report not found")
        }
        res.status(200).json(report);
    });

    generalClosure = asyncHandler(async (
        req: TypedRequest<{ body: GeneralClosureInput}>,
        res: Response,
    ): Promise<void> => {
        const report = await ReportController.service.generalClosure(req.validated.body);
        res.status(201).json(report);
    })

}

export const reportController = ReportController.getInstance()