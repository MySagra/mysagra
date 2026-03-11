import { z } from "zod";
import { registry } from "@/config/swagger";
import {
    RoleResponseSchema,
    cuidParamSchema,
} from "@mysagra/schemas";

// ─── Schemas ────────────────────────────────────────────────────────────────

const RoleResponse = registry.register("RoleResponse", RoleResponseSchema);
const CUIDParam = registry.register("CUIDParam", cuidParamSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

registry.registerPath({
    method: "get",
    path: "/v1/roles",
    summary: "Get all roles",
    tags: ["Roles"],
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "List of roles",
            content: {
                "application/json": {
                    schema: z.array(RoleResponse),
                },
            },
        },
        401: { description: "Unauthorized" },
    },
});

registry.registerPath({
    method: "get",
    path: "/v1/roles/{id}",
    summary: "Get role by ID",
    tags: ["Roles"],
    security: [{ bearerAuth: [] }],
    request: { params: CUIDParam },
    responses: {
        200: {
            description: "Role found",
            content: {
                "application/json": { schema: RoleResponse },
            },
        },
        404: { description: "Role not found" },
        401: { description: "Unauthorized" },
    },
});
