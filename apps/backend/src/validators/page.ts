import Joi from "joi";

export const pageSchema = Joi.object({
    params: Joi.object({
        page: Joi.number().integer().min(0)
    })
})