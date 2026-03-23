import { Router } from "express";
import "./api-keys.docs";
import { authenticate } from "@/middlewares/authenticate";
import { validateRequest } from "@/middlewares/validateRequest";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeySchema, cuidParamSchema } from "@mysagra/schemas";

const apiKeysController = new ApiKeysController(new ApiKeysService);
const router = Router();

router.get(
    "/",
    authenticate(["admin"]),
    apiKeysController.getApiKeys
)

router.get(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    apiKeysController.getApiKey
)

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateApiKeySchema
    }),
    apiKeysController.createApiKey
)

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    apiKeysController.revokeApiKey
)

export default router;