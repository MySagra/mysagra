import { Router } from "express";
import "./ingredients.docs";
import { CreateIngredientSchema, UpdateIngredientSchema, cuidParamSchema } from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { authenticate } from "@/middlewares/authenticate";
import { IngredientsController } from "@/modules/ingredients/ingredients.controller";
import { IngredientsService } from "@/modules/ingredients/ingredients.service";
const ingredientService = new IngredientsService()
const ingredientController = new IngredientsController(ingredientService);
const router = Router();


router.get(
    "/",
    authenticate(["admin", "operator"]),
    ingredientController.getIngredients
)

router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema
    }),
    ingredientController.getIngredientById
)

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateIngredientSchema
    }),
    ingredientController.createIngredient
)

router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdateIngredientSchema
    }),
    ingredientController.updateIngredient
)

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    ingredientController.deleteIngredient
)
export default router;