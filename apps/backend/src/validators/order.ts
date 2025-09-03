import Joi from "joi";

const foodSchema = Joi.object({
    foodId: Joi.number().integer().positive(),
    quantity: Joi.number().integer().min(1).required()
})

export const createOrderSchema = Joi.object({
    body: Joi.object({
        table: Joi.number().min(0).required(),
        customer: Joi.string().min(1).required(),
        foodsOrdered: Joi.array().items(foodSchema).min(1).required()
    })
})

export const idOrderSchema = Joi.object({
    params: Joi.object({
        id: Joi.string().length(3).required()
    })
})

export const updateOrderSchema = Joi.object({
    createOrderSchema,
    idOrderSchema
})