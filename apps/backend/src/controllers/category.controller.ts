import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { CategoryService } from "@/services/category.service";
import { CreateCategoryInput, GetCategoriesQuery, GetCategoryQuery, PatchCategoryInput, UpdateCashRegisterInput, UpdateFoodInput } from "@/schemas";
import { CUIDParam } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class CategoryController {
    constructor(private categoryService: CategoryService) { }

    getCategories = asyncHandler(async (
        req: TypedRequest<{ query: GetCategoriesQuery }>,
        res: Response,
    ): Promise<void> => {
        if (req.user?.role !== "admin" && req.validated.query.available !== true) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        const categories = await this.categoryService.getCategories(req.validated.query);

        if (!Array.isArray(categories)) {
            res.status(404).json({ message: "Users not found" })
            return;
        }

        res.status(200).json(categories);
    });

    getCategoryById = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, query: GetCategoryQuery }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const category = await this.categoryService.getCategoryById(id, req.validated.query)

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json(category);
    });

    createCategory = asyncHandler(async (
        req: TypedRequest<{ body: CreateCategoryInput }>,
        res: Response,
    ): Promise<void> => {
        const category = await this.categoryService.createCategory(req.validated.body);
        res.status(201).json(category);
    });

    updateCategory = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: UpdateFoodInput }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const category = await this.categoryService.updateCategory(id, req.validated.body);
        res.status(200).json(category);
    });

    patchCategory = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam, body: PatchCategoryInput }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const category = await this.categoryService.patchCategory(id, req.validated.body);
        res.status(200).json(category);
    })

    uploadImage = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const file = req.file

        if (!file) {
            res.status(400).json({ message: "Failed to upload image" });
            return;
        }

        const category = await this.categoryService.uploadImage(id, file);
        res.status(200).json(category);
    });

    deleteCategory = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        this.categoryService.deleteCategory(id);
        res.status(204).send();
    })
}