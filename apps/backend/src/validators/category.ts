import Joi from "joi";

export const createCategorySchema = Joi.object({
    body: Joi.object({
        name: Joi.string().min(1).required(),
        available: Joi.bool().required(),
        position: Joi.number().integer().required()
    })
})

export const idCategorySchema = Joi.object({
    params: Joi.object({
        id: Joi.number().integer().positive()
    })
})

export const updateCategorySchema = Joi.object({
    createCategorySchema,
    idCategorySchema
})