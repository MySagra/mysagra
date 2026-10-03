import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { ForbiddenError, UnauthorizedError } from "@/common/errors";
import { usersService } from "@/modules/users/users.service";
import {
    UserResponseSchema,
    CreateUserSchema,
    PatchUserSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

export const usersModule = createModule({
    basePath: "/v1/users",
    tags: ["Users"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all users",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            responses: {
                200: { description: "List of users", schema: z.array(UserResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await usersService.getUsers());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get user by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "User found", schema: UserResponseSchema },
                404: { description: "Not Found - User not found" },
            },
            handler: async (req, res) => {
                const { id } = req.validated.params;
                if (req.user!.role !== "admin" && req.user!.userId !== id) {
                    throw new ForbiddenError("Cannot access another user's profile");
                }
                res.status(200).json(await usersService.getUserById(id));
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new user",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: CreateUserSchema,
            responses: {
                201: { description: "User created", schema: UserResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                409: { description: "Conflict - Username already exists" },
            },
            handler: async (req, res) => {
                res.status(201).json(await usersService.createUser(req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Partially update user",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            body: PatchUserSchema,
            responses: {
                200: { description: "User updated", schema: UserResponseSchema },
                400: { description: "Bad Request - Invalid input or validation error" },
                404: { description: "Not Found - User not found" },
            },
            handler: async (req, res) => {
                if (!req.user) throw new UnauthorizedError("Not authorized");
                const { id } = req.validated.params;
                if (req.user.userId !== id && req.user.role !== "admin") {
                    throw new ForbiddenError("Cannot modify another user");
                }
                if (req.validated.body.role && req.user.role !== "admin") {
                    throw new ForbiddenError("Cannot modify your own role");
                }
                res.status(200).json(await usersService.patchUser(id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete user by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                204: { description: "User deleted" },
                404: { description: "Not Found - User not found" },
            },
            handler: async (req, res) => {
                await usersService.deleteUser(req.validated.params.id);
                res.status(204).send();
            },
        }),
    ],
});
