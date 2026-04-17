import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema, GetReportsQuerySchema } from "@mysagra/schemas";
import { reportController } from "./report.controller";
import "./report.docs";

const router = Router();

router.get(
    "/",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        query: GetReportsQuerySchema
    }),
    reportController.getReports
);

router.get(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        params: cuidParamSchema,
        query: GetReportsQuerySchema
    }),
    reportController.getReport
);

router.post(
    "/general-closure",
    authenticate(["admin", "maintainer"]),
    reportController.generalClosure
)

export default router;