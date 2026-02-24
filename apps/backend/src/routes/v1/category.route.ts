import { Router } from "express";

//middlewares
import { authenticate } from "@/middlewares/authenticate";
import { CreateCategorySchema, cuidParamSchema, GetCategoriesQuerySchema, PatchCategorySchema, UpdateCategorySchema } from "@/schemas";
import { validateRequest } from "@/middlewares/validateRequest";
//service and controller
import { CategoryService } from "@/services/category.service";
import { CategoryController } from "@/controllers/category.controller";

const categoryController = new CategoryController(new CategoryService());
const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "clxyz123456789abcdef"
 *         name:
 *           type: string
 *           example: "Pizzeria"
 *         available:
 *           type: boolean
 *           example: true
 *         position:
 *           type: integer
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
 *           example: 1
 *         printerId:
 *           type: string
 *           nullable: true
 *           description: Optional CUID of the printer associated with this category
 *           example: "clxyz987654321fedcba"
 */

/**
 * @openapi
 * /v1/categories:
 *   get:
 *     summary: Get all categories
 *     description: |
 *       Retrieves all categories from the database with optional filtering and food inclusion.
 *       
 *       **Authentication:**
 *       - If `available=true` is specified: Public endpoint, no authentication required
 *       - If `available=false` or not specified: Requires admin authentication
 *       
 *       **Query Parameters:**
 *       - `available`: Filter by availability status
 *       - `include`: Include related resources (use 'foods' to include foods with their ingredients)
 *     tags:
 *       - Categories
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: query
 *         name: available
 *         schema:
 *           type: boolean
 *         description: Filter categories by availability
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [foods]
 *         description: Include related resources (e.g. foods)
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
    validateRequest({
        query: GetCategoriesQuerySchema
    }),
    categoryController.getCategories
);

/**
 * @openapi
 * /v1/categories/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get a category by ID
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to retrieve
 *         schema:
 *           type: string
 *         example: "clxyz123456789abcdef"
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [foods]
 *         description: Include related resources (e.g. foods)
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *       404:
 *         description: Category not found
 */
router.get(
    "/:id",
    authenticate(["admin", "operator"]),
    validateRequest({
        params: cuidParamSchema,
        query: GetCategoriesQuerySchema
    }),
    categoryController.getCategoryById
);

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
    validateRequest({
        body: CreateCategorySchema
    }),
    categoryController.createCategory
);

/**
 * @openapi
 * /v1/categories/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a category
 *     description: |
 *       Update a category by ID.
 *       
 *       - Changing the **available** field will also update the availability of all associated foods.
 *       - Changing the **printerId** field will also update the printer of all associated foods. Setting it to `null` will remove the printer association from the category and all its foods.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to update
 *         schema:
 *           type: string
 *         example: "clxyz123456789abcdef"
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
    validateRequest({
        params: cuidParamSchema,
        body: UpdateCategorySchema
    }),
    categoryController.updateCategory
);

/**
 * @openapi
 * /v1/categories/{id}:
 *   patch:
 *     security:
 *       - bearerAuth: []
 *     summary: Partially update a category
 *     description: |
 *       Partially update a category by ID.
 *       
 *       - Changing the **available** field will also update the availability of all associated foods.
 *       - Changing the **printerId** field will also update the printer of all associated foods. Setting it to `null` will remove the printer association from the category and all its foods.
 *     tags:
 *       - Categories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the category to update
 *         schema:
 *           type: string
 *         example: "clxyz123456789abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               available:
 *                 type: boolean
 *                 description: The new availability status of the category
 *             example:
 *               available: true
 *     responses:
 *       200:
 *         description: Category availability updated successfully
 *       404:
 *         description: Category not found
 */
router.patch(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema,
        body: PatchCategorySchema
    }),
    categoryController.patchCategory
)


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
 *           type: string
 *         example: "clxyz123456789abcdef"
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
    validateRequest({
        params: cuidParamSchema
    }),
    CategoryService.imageService.upload(),
    categoryController.uploadImage
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
 *           type: string
 *         example: "clxyz123456789abcdef"
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete(
    "/:id",
    authenticate(["admin"]),
    validateRequest({
        params: cuidParamSchema
    }),
    categoryController.deleteCategory
);

export default router;