import { Router } from "express";
import "./printers.docs";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema, CreatePrinterSchema, UpdatePrinterSchema, PatchPrinterSchema } from "@mysagra/schemas";
import { PrintersController } from "@/modules/printers/printers.controller";
import { PrintersService } from "@/modules/printers/printers.service";
const printerController = new PrintersController(new PrintersService());
const router = Router();


router.get(
    "/",
    authenticate(["admin", "operator"]),
    printerController.getPrinters
);

router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema,
    }),
    printerController.getPrinterById
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreatePrinterSchema
    }),
    printerController.createPrinter
);

router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdatePrinterSchema
    }),
    printerController.updatePrinter
);

router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchPrinterSchema
    }),
    printerController.patchPrinter
);

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    printerController.deletePrinter
);
export default router;