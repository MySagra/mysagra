import { Router } from "express";

import { foodSchema, getFoodsQuerySchema, cuidParamSchema, idParamSchema, getFoodQuerySchema } from "@/schemas";
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
 *           type: string
 *           example: "clxyz123456789abcdef"
 *         available:
 *           type: boolean
 *           example: true
 *         category:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "clxyz123456789abcdef"
 *             name:
 *               type: string
 *               example: "Pizzeria"
 *             available:
 *               type: boolean
 *               example: true
 *             position:
 *               type: integer
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
 *           type: string
 *           example: "clxyz123456789abcdef"
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
 *     security:
 *       - bearerAuth: []
 *     summary: Get all foods
 *     description: |
 *       Retrieves all foods from the database. Supports optional filtering, grouping by category and ingredient inclusion.
 *       
 *       **Query Parameters:**
 *       - `include`: Include additional data (use 'ingredients' to include ingredient details)
 *       - `groupBy`: Group results (use 'category' to group foods by category)
 *       - `available`: Filter by availability status (true/false)
 *       - `category`: Filter by category names (can be used multiple times)
 *       
 *       **Response formats:**
 *       - Without `groupBy`: Returns flat array of food items
 *       - With `groupBy=category`: Returns array of categories, each containing its foods
 *       
 *       **Authorization:**
 *       - Non-admin users can only access foods with `available=true`
 *       - Admin users can access all foods regardless of availability
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
 *         name: groupBy
 *         required: false
 *         description: Group results by category
 *         schema:
 *           type: string
 *           enum: [category]
 *         example: category
 *       - in: query
 *         name: available
 *         required: false
 *         description: Filter by availability status. Leave empty to show all (admin only).
 *         schema:
 *           type: boolean
 *         example: true
 *       - in: query
 *         name: category
 *         required: false
 *         description: Filter by category names (can be used multiple times for multiple categories). Leave empty to show all categories.
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         style: form
 *         explode: true
 *         example: Pizzeria
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
 *                         type: string
 *                         example: "clxyz123456789abcdef"
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
        query: getFoodsQuerySchema
    }),
    foodController.getFoods
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
 *       401:
 *         description: Unauthorized - Non-admin users can only access available foods
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
 * /v1/foods/{id}:
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               available:
 *                 type: boolean
 *                 description: New availability status
 *                 example: false
 *     responses:
 *       200:
 *         description: Food availability updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FoodResponse'
 *       400:
 *         description: Invalid ID parameter or request body
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Food item not found
 */
router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    foodController.patchFood
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
 *     security:
 *       - bearerAuth: []
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