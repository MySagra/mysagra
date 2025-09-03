import { Request, Response, NextFunction, RequestHandler } from "express";
import Joi from "joi";

export const createUserSchema = Joi.object({
    body: Joi.object({
        username: Joi.string().min(4).required(),
        password: Joi.string().min(8).required(),
        roleId: Joi.number().integer().min(0).required()
    })
})

export const idUserSchema = Joi.object({
    params: Joi.object({
        id: Joi.number().integer().positive()
    })
})

export const updateUserSchema = Joi.object({
    createUserSchema,
    idUserSchema
})