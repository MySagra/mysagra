import { Router } from "express";
import './auth.docs'
import { LoginSchema, RevokeSessionParamsSchema } from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { AuthService } from "@/modules/auth/auth.service";
import { AuthController } from "@/modules/auth/auth.controller";
import { authenticate } from "@/middlewares/authenticate";
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

router.get(
    "/sessions",
    authenticate(["admin", "maintainer", "operator"]),
    authController.getSessions
)

router.delete(
    "/session/:sessionId",
    authenticate(["admin", "maintainer", "operator"]),
    validateRequest({
        params: RevokeSessionParamsSchema
    }),
    authController.revokeSession
)

export default router;