import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    UserResponseSchema,
    CreateUserSchema,
    PatchUserSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const UserResponse = registry.register("UserResponse", UserResponseSchema);
const CreateUserRequest = registry.register("CreateUserRequest", CreateUserSchema);
const PatchUserRequest = registry.register("PatchUserRequest", PatchUserSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// UpdateUserRequest is intentionally omitted — PUT /users/:id is not yet implemented.
// TODO: restore when session management allows full user updates.

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/users",
    summary: "Get all users",
    tags: ["Users"],
    security: [{ cookieAuth: [] }],
    responses: {
        200: {
            description: "List of users",
            content: {
                "application/json": {
                    schema: z.array(UserResponse),
                },
            },
        },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/users/{id}",
    summary: "Get user by ID",
    tags: ["Users"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "User found",
            content: {
                "application/json": { schema: UserResponse },
            },
        },
        404: { description: "Not Found - User not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "post",
    path: "/v1/users",
    summary: "Create a new user",
    tags: ["Users"],
    security: [{ cookieAuth: [] }],
    request: {
        body: {
            required: true,
            content: {
                "application/json": { schema: CreateUserRequest },
            },
        },
    },
    responses: {
        201: {
            description: "User created",
            content: {
                "application/json": { schema: UserResponse },
            },
        },
        400: { description: "Bad Request - Invalid input or validation error" },
        409: { description: "Conflict - Username already exists" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

// TODO: implement PUT /users/:id after session management is in place.
// This endpoint will allow full user updates (username, password, role).
/*
registry.registerPath({
    method: "put",
    path: "/v1/users/{id}",
    summary: "Update user by ID (not yet implemented)",
    tags: ["Users"],
    ...
});
*/

registry.registerPath({
    method: "patch",
    path: "/v1/users/{id}",
    summary: "Update user role",
    tags: ["Users"],
    security: [{ cookieAuth: [] }],
    request: {
        params: CUIDParam,
        body: {
            required: true,
            content: {
                "application/json": { schema: PatchUserRequest },
            },
        },
    },
    responses: {
        200: {
            description: "User role updated",
            content: {
                "application/json": { schema: UserResponse },
            },
        },
        404: { description: "Not Found - User not found" },
        400: { description: "Bad Request - Invalid role ID" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/v1/users/{id}",
    summary: "Delete user by ID",
    tags: ["Users"],
    security: [{ cookieAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        204: { description: "User deleted" },
        404: { description: "Not Found - User not found" },
        401: { description: "Unauthorized - Invalid or missing authentication" },
        403: { description: "Forbidden - Insufficient permissions" },
        429: { description: "Too Many Requests - Rate limit exceeded" },
    },
});
