import { Router } from "express";
import './auth.docs'
import { LoginSchema } from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthController } from "@/modules/auth/auth.controller";
const authController = new AuthController(new AuthService());
const router = Router();


router.post(
    "/login",
    validateRequest({
        body: LoginSchema
    }),
    authController.login
);

router.post(
    "/logout",
    authController.logout
);

router.post(
    "/refresh",
    authController.refresh
)
export default router;