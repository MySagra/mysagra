import { Router } from "express";
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getAvailableCategories, patchAvailableCategory, getImage, uploadImage } from "@/controllers/category.controller";
import { checkUniqueCategoryName, checkCategoryExists } from "@/middlewares/checkCategory";
import { authenticate } from "@/middlewares/authenticate";
import { ImageService } from "@/services/image.service";

import {createCategorySchema, updateCategorySchema, idCategorySchema} from "@/validators/category";
import { validateRequest } from "@/middlewares/validateRequest";

const imageService = new ImageService("categories");
const router = Router();

/**
 * @swagger
 * components:
  *   schemas:
  *     CategoryResponse:
  *       type: object
  *       properties:
  *         id:
  *           type: integer
  *           format: int64
  *           example: 1
  *         name:
  *           type: string
  *           example: "Pizzeria"
  *         available:
  *           type: boolean
  *           example: true
  *         position:
  *           type: integer
  *           format: int64
  *           example: 1
  *     CategoryRequest:
  *       type: object
  *       properties:
  *         name:
  *           type: string
  *           example: "Pizzeria"
  *         available:
  *           type: boolean
  *           example: true
  *         position:
  *           type: integer
  *           format: int64
  *           example: 1
  */

/**
 * @openapi
 * /v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryResponse'
 */
router.get(
    "/",
    getCategories
);

/**
 * @openapi
 * /v1/categories/available:
 *   get:
 *     summary: Get all available categories
 *     tags:
 *       - Categories
 *     responses:
 *       200:
 *         description: List of available categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoryResponse'
 * 
 */

router.get(
    "/available",
    getAvailableCategories
)

/**
 * @openapi
 * /v1/categories/available/{id}:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Update availability status of a category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to update
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 1
 *     responses:
 *       200:
 *         description: Category availability updated successfully
 *       404:
 *         description: Category not found
 */
router.patch(
    "/available/:id",
    authenticate(["admin"]),
    validateRequest(idCategorySchema),
    checkCategoryExists,
    patchAvailableCategory
)

/**
 * @openapi
 * /v1/categories:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new category
 *     tags:
 *       - Categories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid request body
 */

router.post(
    "/",
    authenticate(["admin"]),
    validateRequest(createCategorySchema),
    checkUniqueCategoryName,
    createCategory
);

/**
 * @openapi
 * /v1/categories/{id}/image:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Update category image
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to update
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload for the category
 *             required:
 *               - image
 *     responses:
 *       200:
 *         description: Category image updated successfully
 *       400:
 *         description: Invalid image file or missing image
 *       404:
 *         description: Category not found
 */
router.patch(
    "/:id/image",
    authenticate(["admin"]),
    validateRequest(idCategorySchema),
    checkCategoryExists,
    imageService.upload(),
    uploadImage
);

/**
 * @openapi
 * /v1/categories/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to update
 *         schema:
 *           type: integer
 *           format: int64
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Category not found
 *       409:
 *         description: Category conflict
 */
router.put(
    "/:id",
    authenticate(["admin"]),
    validateRequest(updateCategorySchema),
    checkCategoryExists,
    checkUniqueCategoryName,
    updateCategory
);

/**
 * @openapi
 * /v1/categories/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a category
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to delete
 *         schema:
 *           type: integer
 *           format: int64
 *         example: 1
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest(idCategorySchema),
    deleteCategory
);

/**
 * @openapi
 * /v1/categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to retrieve
 *         schema:
 *           type: integer
 *           format: int64
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get(
    "/:id",
    validateRequest(idCategorySchema),
    getCategoryById
);

export default router;