import { Request, Response, NextFunction, RequestHandler } from "express";
import Joi from "joi";

export const createRoleSchema = Joi.object({
    body: Joi.object({
        name: Joi.string().min(1).required()
    })
})

export const idRoleSchema = Joi.object({
    params: Joi.object({
        id: Joi.number().integer().positive()
    })
})

export const updateRoleSchema = Joi.object({
    createRoleSchema,
    idRoleSchema
})