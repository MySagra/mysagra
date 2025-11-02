import { Request, Response, NextFunction } from "express";

import { asyncHandler } from "@/utils/asyncHandler";
import { IngredientService } from "@/services/ingredient.service";

export class IngredientController {
    constructor(private ingredientService: IngredientService) { }

    getIngredients = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const ingredients = await this.ingredientService.getIngredients()

        if (!Array.isArray(ingredients)) {
            res.status(404).json({ message: "Ingredients not found" })
        }
        res.status(200).json(ingredients);
    });

    getIngredientById = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const ingredient = await this.ingredientService.getIngredientById(id)

        if (!ingredient) {
            res.status(404).json({ message: "Ingredients not found" })
        }
        res.status(200).json(ingredient);
    });

    createIngredient = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { name } = req.body
        const ingredient = await this.ingredientService.createIngredient(name)

        res.status(201).json(ingredient);
    });

    updateIngredient = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        const { name } = req.body
        const ingredient = await this.ingredientService.updateIngredient(id, name)

        res.status(200).json(ingredient);
    });

    deleteIngredient = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { id } = req.params;
        await this.ingredientService.deleteIngredient(id)

        res.status(204).send();
    });


}