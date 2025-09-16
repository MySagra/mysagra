import { NextFunction, Request, Response } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { CategoryService } from "@/services/category.service";

export class CategoryController {
    constructor(private categoryService: CategoryService) { }

    getCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const categories = await this.categoryService.getCategories();

        if (!Array.isArray(categories)) {
            res.status(404).json({ message: "Users not found" })
        }

        res.status(200).json(categories);
    });

    getCategoryById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const category = await this.categoryService.getCategoryById(parseInt(id))

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json(category);
    });

    getAvailableCategories = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const categories = await this.categoryService.getAvailableCategories();
        res.status(200).json(categories);
    })

    getCategoryByName = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name } = req.params;
        const category = await this.categoryService.getCategoryByName(name)

        if (!category) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.status(200).json(category);
    });

    createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name, available, position } = req.body;
        const category = await this.categoryService.createCategory(name, available, position);
        res.status(201).json(category);
    });

    updateCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { name, available, position } = req.body;
        const category = await this.categoryService.updateCategory(parseInt(id), name, available, position);
        res.status(200).json(category);
    });

    patchCategoryAvailable = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const category = await this.categoryService.patchAvailableCategory(parseInt(id));
        res.status(200).json(category);
    })

    uploadImage = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const file = req.file

        if(!file){
            res.status(400).json({ message: "Failed to upload image" });
            return;
        }

        const category = await this.categoryService.uploadImage(parseInt(id), file);
        res.status(200).json(category);
    });

    deleteCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        this.categoryService.deleteCategory(parseInt(id));
        res.status(204).send();
    })
}