import { Router } from "express";

import { ingredientSchema } from "@/schemas/ingredient";
import { cuidParamSchema } from "@/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
import { authenticate } from "@/middlewares/authenticate";

import { IngredientController } from "@/controllers/ingredient.controller";
import { IngredientService } from "@/services/ingredient.service";

const ingredientService = new IngredientService()
const ingredientController = new IngredientController(ingredientService);

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     IngredientResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clm1234567890"
 *         name:
 *           type: string
 *           example: "Mozzarella"
 *     IngredientRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Mozzarella"
 */

/**
 * @openapi
 * /v1/ingredients:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all ingredients
 *     tags:
 *       - Ingredients
 *     responses:
 *       200:
 *         description: A list of ingredients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/IngredientResponse'
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/",
    authenticate(["admin"]),
    ingredientController.getIngredients
)

/**
 * @openapi
 * /v1/ingredients/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get an ingredient by ID
 *     tags:
 *       - Ingredients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the ingredient to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ingredient retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IngredientResponse'
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Ingredient not found
 *       401:
 *         description: Unauthorized
 */
router.get(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    ingredientController.getIngredientById
)

/**
 * @openapi
 * /v1/ingredients:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new ingredient
 *     tags:
 *       - Ingredients
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IngredientRequest'
 *     responses:
 *       201:
 *         description: Ingredient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IngredientResponse'
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Ingredient name already exists
 */
router.post(
    "/",
    authenticate(["admin"]),
    validateRequest({
        body: ingredientSchema
    }),
    ingredientController.createIngredient
)

/**
 * @openapi
 * /v1/ingredients/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update an ingredient
 *     tags:
 *       - Ingredients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the ingredient to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IngredientRequest'
 *     responses:
 *       200:
 *         description: Ingredient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IngredientResponse'
 *       400:
 *         description: Invalid request body or invalid ID parameter
 *       404:
 *         description: Ingredient not found
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Ingredient name already exists
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: ingredientSchema
    }),
    ingredientController.updateIngredient
)

/**
 * @openapi
 * /v1/ingredients/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete an ingredient
 *     tags:
 *       - Ingredients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the ingredient to delete
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Ingredient deleted successfully
 *       400:
 *         description: Invalid ID parameter
 *       404:
 *         description: Ingredient not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    ingredientController.updateIngredient
)

export default router;