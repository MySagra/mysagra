import { Router } from "express";
import "./foods.docs";
import { 
    CreateFoodSchema, 
    GetFoodsQuerySchema, 
    cuidParamSchema, 
    GetFoodQuerySchema, 
    PatchFoodSchema, 
    UpdateFoodSchema 
} from "@mysagra/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { authenticate } from "@/middlewares/authenticate";
import { FoodsController } from "@/modules/foods/foods.controller";
import { FoodsService } from "@/modules/foods/foods.service";
const foodService = new FoodsService();
const foodController = new FoodsController(foodService);
const router = Router();


router.get(
    "/",
    authenticate(["admin", "operator"]),
    validateRequest({
        query: GetFoodsQuerySchema
    }),
    foodController.getFoods
);

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: CreateFoodSchema
    }),
    foodController.createFood
);

router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: UpdateFoodSchema
    }),
    foodController.updateFood
);

router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchFoodSchema
    }),
    foodController.patchFood
)

router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    foodController.deleteFood
);

router.get(
    "/:id",
    validateRequest({
        params: cuidParamSchema,
        query: GetFoodQuerySchema
    }),
    foodController.getFoodById
);
export default router;