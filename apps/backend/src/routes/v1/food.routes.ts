import { Router } from "express";

import { foodSchema, getFoodQuerySchema, cuidParamSchema, idParamSchema } from "@/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { authenticate } from "@/middlewares/authenticate";

import { FoodController } from "@/controllers/food.controller";
import { FoodService } from "@/services/food.service";

const foodService = new FoodService();
const foodController = new FoodController(foodService);

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     FoodIngredient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           example: "clm1234567890"
 *     Ingredient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           example: "clm1234567890"
 *         name:
 *           type: string
 *           example: "Mozzarella"
 *     FoodResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           example: "clm9876543210"
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
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               format: int64
 *               example: 1
 *             name:
 *               type: string
 *               example: "Pizzeria"
 *             available:
 *               type: boolean
 *               example: true
 *             position:
 *               type: integer
 *               format: int64
 *               example: 1
 *         ingredients:
 *           type: array
 *           description: Array of ingredients (only included when 'include=ingredients' query parameter is used)
 *           items:
 *             $ref: '#/components/schemas/Ingredient'
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
 *         ingredients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FoodIngredient'
 *           example: [{"id": "clm1234567890"}, {"id": "clm0987654321"}]
 */

/**
 * @openapi
 * /v1/foods:
 *   get:
 *     summary: Get all foods
 *     description: |
 *       Retrieves all foods from the database. Supports optional grouping by category and ingredient inclusion.
 *       
 *       **Query Parameters:**
 *       - `include`: Include additional data (use 'ingredients' to include ingredient details)
 *       - `group_by`: Group results (use 'category' to group foods by category)
 *       
 *       **Response formats:**
 *       - Without `group_by`: Returns flat array of food items
 *       - With `group_by=category`: Returns array of categories, each containing its foods
 *       
 *       **Note:** Parameter uses snake_case format (`group_by`, not `groupBy`)
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: query
 *         name: include
 *         required: false
 *         description: Include additional data (use 'ingredients' to include ingredient details)
 *         schema:
 *           type: string
 *           enum: [ingredients]
 *         example: ingredients
 *       - in: query
 *         name: group_by
 *         required: false
 *         description: Group results by category (snake_case format)
 *         schema:
 *           type: string
 *           enum: [category]
 *         example: category
 *     responses:
 *       200:
 *         description: A list of foods or grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   description: Flat array when group-by is not specified
 *                   items:
 *                     $ref: '#/components/schemas/FoodResponse'
 *                 - type: array
 *                   description: Array of categories when group-by=category
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Pizzeria"
 *                       available:
 *                         type: boolean
 *                         example: true
 *                       position:
 *                         type: integer
 *                         example: 1
 *                       foods:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/FoodResponse'
 */
router.get(
    "/",
    validateRequest({
        query: getFoodQuerySchema
    }),
    foodController.getFoods
);

/**
 * @openapi
 * /v1/foods/available:
 *   get:
 *     summary: Get all available foods
 *     description: |
 *       Retrieves only available foods from the database. Supports optional grouping by category and ingredient inclusion.
 *       
 *       **Query Parameters:**
 *       - `include`: Include additional data (use 'ingredients' to include ingredient details)
 *       - `group_by`: Group results (use 'category' to group foods by category)
 *       
 *       **Response formats:**
 *       - Without `group_by`: Returns flat array of available food items
 *       - With `group_by=category`: Returns array of categories, each containing its available foods
 *       
 *       **Note:** Parameter uses snake_case format (`group_by`, not `groupBy`)
 *     tags:
 *       - Foods
 *     parameters:
 *       - in: query
 *         name: include
 *         required: false
 *         description: Include additional data (use 'ingredients' to include ingredient details)
 *         schema:
 *           type: string
 *           enum: [ingredients]
 *         example: ingredients
 *       - in: query
 *         name: group_by
 *         required: false
 *         description: Group results by category (snake_case format)
 *         schema:
 *           type: string
 *           enum: [category]
 *         example: category
 *     responses:
 *       200:
 *         description: A list of available foods or grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: array
 *                   description: Flat array when group-by is not specified
 *                   items:
 *                     $ref: '#/components/schemas/FoodResponse'
 *                 - type: array
 *                   description: Array of categories when group-by=category
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Pizzeria"
 *                       available:
 *                         type: boolean
 *                         example: true
 *                       position:
 *                         type: integer
 *                         example: 1
 *                       foods:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/FoodResponse'
 */
router.get(
    "/available/",
    validateRequest({
        query: getFoodQuerySchema
    }),
    foodController.getAvailableFoods
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
    validateRequest({
        body: foodSchema
    }),
    foodController.createFood
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
 *           type: string
 *           format: cuid
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
    validateRequest({
        params: cuidParamSchema,
        body: foodSchema
    }),
    foodController.updateFood
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
 *           type: string
 *           format: cuid
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
    validateRequest({
        params: cuidParamSchema
    }),
    foodController.patchFoodAvailable
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
 *       - in: query
 *         name: include
 *         required: false
 *         description: Include additional data (use 'ingredients' to include ingredient details)
 *         schema:
 *           type: string
 *           enum: [ingredients]
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
    validateRequest({
        params: idParamSchema,
        query: getFoodQuerySchema
    }),
    foodController.getAvailableFoodsByCategoryId
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
 *       - in: query
 *         name: include
 *         required: false
 *         description: Include additional data (use 'ingredients' to include ingredient details)
 *         schema:
 *           type: string
 *           enum: [ingredients]
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
    validateRequest({
        params: idParamSchema,
        query: getFoodQuerySchema
    }),
    foodController.getFoodsByCategoryId
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
 *           type: string
 *           format: cuid
 *     responses:
 *       204:
 *         description: Food item deleted successfully
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Food item not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    foodController.deleteFood
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
 *           type: string
 *           format: cuid
 *       - in: query
 *         name: include
 *         required: false
 *         description: Include additional data (use 'ingredients' to include ingredient details)
 *         schema:
 *           type: string
 *           enum: [ingredients]
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
    validateRequest({
        params: cuidParamSchema,
        query: getFoodQuerySchema
    }),
    foodController.getFoodById
);



export default router;