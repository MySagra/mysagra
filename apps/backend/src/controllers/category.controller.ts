import { Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { CategoryService } from "@/services/category.service";
import { Category } from "@/schemas";
import { CUIDParam } from "@/schemas";
import { TypedRequest } from "@/types/request";

export class CategoryController {
    constructor(private categoryService: CategoryService) { }

    getCategories = asyncHandler(async (
        req: TypedRequest<{}>, 
        res: Response, 
    ): Promise<void> => {
        const categories = await this.categoryService.getCategories();

        if (!Array.isArray(categories)) {
            res.status(404).json({ message: "Users not found" })
            return;
        }

        res.status(200).json(categories);
    });

    getCategoryById = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const category = await this.categoryService.getCategoryById(id)

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json(category);
    });

    getAvailableCategories = asyncHandler(async (
        req: TypedRequest<{}>, 
        res: Response, 
    ): Promise<void> => {
        const categories = await this.categoryService.getAvailableCategories();
        res.status(200).json(categories);
    })

    getCategoryByName = asyncHandler(async (
        req: TypedRequest<{params: {name: string}}>, 
        res: Response, 
    ): Promise<void> => {
        const { name } = req.validated.params;
        const category = await this.categoryService.getCategoryByName(name)

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json(category);
    });

    createCategory = asyncHandler(async (
        req: TypedRequest<{body: Category}>, 
        res: Response, 
    ): Promise<void> => {
        const category = await this.categoryService.createCategory(req.validated.body);
        res.status(201).json(category);
    });

    updateCategory = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam, body: Category}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const category = await this.categoryService.updateCategory(id, req.validated.body);
        res.status(200).json(category);
    });

    patchCategoryAvailable = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const category = await this.categoryService.patchAvailableCategory(id);
        res.status(200).json(category);
    })

    uploadImage = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        const file = req.file
        
        if(!file){
            res.status(400).json({ message: "Failed to upload image" });
            return;
        }

        const category = await this.categoryService.uploadImage(id, file);
        res.status(200).json(category);
    });

    deleteCategory = asyncHandler(async (
        req: TypedRequest<{params: CUIDParam}>, 
        res: Response, 
    ): Promise<void> => {
        const { id } = req.validated.params;
        this.categoryService.deleteCategory(id);
        res.status(204).send();
    })
}