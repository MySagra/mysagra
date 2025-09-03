import { Router } from "express";
import { getFoods, getFoodById, getFoodByCategory, createFood, updateFood, deleteFood, getAvailableFoods, getAvailableFoodByCategory, patchFoodAvailable } from "@/controllers/food.controller";
import { checkUniqueFoodName, checkFoodExists, checkFoodCategoryExists } from "@/middlewares/checkFood";
import { validateRequest } from "@/middlewares/validateRequest";
import { createFoodSchema, updateFoodSchema, idFoodSchema } from "@/validators/food";
import { authenticate } from "@/middlewares/authenticate";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     FoodResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           format: int64
 *           example: 1
 *         name:
 *           type: string
 *           example: "Pizza"
 *         description:
 *           type: string
 *           example: "Delicious cheese pizza"
 *         price:
 *           type: number
 *           format: float
 *           example: 9.99
 *         categoryId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         available:
 *           type: boolean
 *           example: true
 *         image:
 *           type: string
 *           example: "pizza.jpg"
 *     FoodRequest:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - available
 *         - categoryId
 *       properties:
 *         name:
 *           type: string
 *           example: "Pizza"
 *         description:
 *           type: string
 *           example: "Delicious cheese pizza"
 *         price:
 *           type: number
 *           format: float
 *           example: 9.99
 *         categoryId:
 *           type: integer
 *           format: int64
 *           example: 1
 *         available:
 *           type: boolean
 *           example: true
 */

/**
 * @openapi
 * /v1/foods:
 *   get:
 *     summary: Get all foods
 *     tags:
 *       - Foods
 *     responses:
 *       200:
 *         description: A list of foods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FoodResponse'
 */
router.get(
    "/",
    getFoods
);

/**
 * @openapi
 * /v1/foods/available:
 *   get:
 *     summary: Get all available foods
 *     tags:
 *       - Foods
 *     responses:
 *       200:
 *         description: A list of available foods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FoodResponse'
 */
router.get(
    "/available/",
    getAvailableFoods
);

/**
 * @openapi
 * /v1/foods:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new food item
 *     tags:
 *       - Foods
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FoodRequest'
 *     responses:
 *       201:
 *         description: Food item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid request body
 *       409:
 *         description: Food name already exists
 */
router.post(
    "/",
    authenticate(["admin"]),
    validateRequest(createFoodSchema),
    checkFoodCategoryExists,
    checkUniqueFoodName,
    createFood
);

/**
 * @openapi
 * /v1/foods/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a food item
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the food item to update
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FoodRequest'
 *     responses:
 *       200:
 *         description: Food item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid request body or invalid ID parameter
 *       404:
 *         description: Food item not found
 *       409:
 *         description: Food name already exists
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest(updateFoodSchema),
    checkFoodExists,
    checkUniqueFoodName,
    updateFood
);

/**
 * @openapi
 * /v1/foods/available/{id}:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Update availability status of a food item
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the food item to update
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Food availability updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Food item not found
 */
router.patch(
    "/available/:id",
    authenticate(["admin"]),
    validateRequest(idFoodSchema),
    checkFoodExists,
    patchFoodAvailable
)

/**
 * @openapi
 * /v1/foods/available/categories/{id}:
 *   get:
 *     summary: Get all available foods by category
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: List of available foods in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid category ID parameter
 */
router.get(
    "/available/categories/:id",
    validateRequest(idFoodSchema),
    getAvailableFoodByCategory
);

/**
 * @openapi
 * /v1/foods/categories/{id}:
 *   get:
 *     summary: Get all foods by category
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: List of foods in the specified category
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid category ID parameter
 */
router.get(
    "/categories/:id",
    validateRequest(idFoodSchema),
    getFoodByCategory
)

/**
 * @openapi
 * /v1/foods/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a food item
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the food item to delete
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Food item deleted successfully
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Food item not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest(idFoodSchema),
    checkFoodExists,
    deleteFood
);

/**
 * @openapi
 * /v1/foods/{id}:
 *   get:
 *     summary: Get a food item by ID
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the food item to retrieve
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Food item retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Food item not found
 */
router.get(
    "/:id",
    validateRequest(idFoodSchema),
    getFoodById
);



export default router;