import { Router } from "express";
import "./banner.docs";
import { authenticate } from "@/middlewares/authenticate";
import { BannerInputSchema, cuidParamSchema } from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";

import { BannerService } from "./banner.service";
import { BannerController } from "./banner.controller";

const bannerController = new BannerController(new BannerService())
const router = Router();

router.get(
    "/",
    authenticate(["admin", "maintainer", "operator"], ["ms_wb_"]),
    bannerController.getBanners
)

router.get(
    "/:id",
    authenticate(["admin", "maintainer", "operator"], ["ms_wb_"]),
    validateRequest({
        params: cuidParamSchema
    }),
    bannerController.getBanner
)

router.post(
    "/",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        body: BannerInputSchema
    }),
    bannerController.createBanner
)

router.put(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        params: cuidParamSchema,
        body: BannerInputSchema
    }),
    bannerController.updateBanner
)

router.patch(
    "/:id/image",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        params: cuidParamSchema
    }),
    BannerService.imageService.upload(),
    bannerController.uploadImage
)

router.delete(
    "/:id",
    authenticate(["admin", "maintainer"]),
    validateRequest({
        params: cuidParamSchema
    }),
    bannerController.deleteBanner
)

export default router;
