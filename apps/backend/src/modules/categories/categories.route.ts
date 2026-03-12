import { Router } from "express";
import "./categories.docs";

import { authenticate } from "@/middlewares/authenticate";
import { 
    CreateCategorySchema, 
    cuidParamSchema, 
    GetCategoriesQuerySchema, 
    PatchCategorySchema, 
    UpdateCategorySchema 
} from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";

import { CategoriesService } from "@/modules/categories/categories.service";
import { CategoriesController } from "@/modules/categories/categories.controller";
const categoryController = new CategoriesController(new CategoriesService());
const router = Router();


router.get(
    "/",
    validateRequest({
        query: GetCategoriesQuerySchema
    }),
    categoryController.getCategories
);

router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema,
        query: GetCategoriesQuerySchema
    }),
    categoryController.getCategoryById
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateCategorySchema
    }),
    categoryController.createCategory
);

router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdateCategorySchema
    }),
    categoryController.updateCategory
);

router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchCategorySchema
    }),
    categoryController.patchCategory
)

router.patch(
    "/:id/image",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    CategoriesService.imageService.upload(),
    categoryController.uploadImage
);

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    categoryController.deleteCategory
);
export default router;