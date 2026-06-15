import { Router } from "express";
import "./users.docs";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { CreateUserSchema, cuidParamSchema, PatchUserSchema } from "@mysagra/schemas";
import { UsersService } from "@/modules/users/users.service";
import { UsersController } from "@/modules/users/users.controller";
const userController = new UsersController(new UsersService());
const router = Router();


router.get(
    "/",
    authenticate(["admin"]),
    userController.getUsers
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateUserSchema
    }),
    userController.createUser
);

router.patch(
    "/:id",
    authenticate(["admin", "maintainer", "operator"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchUserSchema
    }),
    userController.patchUser
)

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    userController.deleteUser
);

router.get(
    "/:id",
    authenticate(["admin", "maintainer", "operator"]),
    validateRequest({
        params: cuidParamSchema
    }),
    userController.getUserById
);
export default router;