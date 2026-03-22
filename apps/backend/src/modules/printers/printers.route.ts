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
    authenticate(["admin", "maintainer", "operator"], ["ms_pt_"]),
    printerController.getPrinters
);

router.get(
    "/:id",
    authenticate(["admin", "maintainer", "operator"], ["ms_pt_"]),
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
    authenticate(["admin"], ["ms_pt_"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdatePrinterSchema
    }),
    printerController.updatePrinter
);

router.patch(
    "/:id",
    authenticate(["admin", "maintainer"], ["ms_pt_"]),
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