import { Router } from "express";
import { authenticate } from "@/middlewares/authenticate";

import { validateRequest } from "@/middlewares/validateRequest";
import { CreateRoleSchema, idParamSchema } from "@/schemas";

import { RoleController } from "@/controllers/role.controller";
import { RoleService } from "@/services/role.service";

const roleController = new RoleController(new RoleService());

const router = Router();

router.get(
    "/",
    authenticate(["admin", "operator"]),
    roleController.getRoles
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateRoleSchema
    }),
    roleController.createRole
);
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema,
        body: CreateRoleSchema
    }),
    roleController.updateRole
);

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: idParamSchema
    }),
    roleController.deleteRole
);
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: idParamSchema
    }),
    roleController.getRoleById
);

export default router;