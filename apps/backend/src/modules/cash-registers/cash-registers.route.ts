import { Router } from "express";
import "./cash-registers.docs";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { 
    cuidParamSchema, 
    CreateCashRegisterSchema, 
    GetCashRegisterQuerySchema, 
    PatchCashRegisterSchema, 
    UpdateCashRegisterSchema 
} from "@mysagra/schemas";
import { CashRegistersController } from "@/modules/cash-registers/cash-registers.controller";
import { CashRegistersService } from "@/modules/cash-registers/cash-registers.service";
const cashRegisterController = new CashRegistersController(new CashRegistersService());
const router = Router();


router.get(
    "/",
    authenticate(["admin", "operator"]),
    validateRequest({
        query: GetCashRegisterQuerySchema
    }),
    cashRegisterController.getCashRegisters
);

router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema,
        query: GetCashRegisterQuerySchema
    }),
    cashRegisterController.getCashRegisterById
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateCashRegisterSchema
    }),
    cashRegisterController.createCashRegister
);

router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdateCashRegisterSchema
    }),
    cashRegisterController.updateCashRegister
);
router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchCashRegisterSchema
    }),
    cashRegisterController.patchCashRegister
);

router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchCashRegisterSchema
    }),
    cashRegisterController.patchCashRegister
);

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    cashRegisterController.deleteCashRegister
);
export default router;