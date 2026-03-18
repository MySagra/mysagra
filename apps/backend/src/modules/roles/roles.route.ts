import { Router } from "express";
import "./roles.docs";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { cuidParamSchema } from "@mysagra/schemas";
import { RolesController } from "@/modules/roles/roles.controller";
import { RolesService } from "@/modules/roles/roles.service";
const roleController = new RolesController(new RolesService());
const router = Router();

router.get(
    "/",
    authenticate(["admin", "maintainer", "operator"]),
    roleController.getRoles
);

router.get(
    "/:id",
    authenticate(["admin", "maintainer", "operator"]),
    validateRequest({
        params: cuidParamSchema
    }),
    roleController.getRoleById
);

export default router;