import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { RolesService } from "@/modules/roles/roles.service";
import { RoleResponseSchema, cuidParamSchema } from "@mysagra/schemas";

const service = new RolesService();

export const rolesModule = createModule({
    basePath: "/v1/roles",
    tags: ["Roles"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all roles",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            responses: {
                200: { description: "List of roles", schema: z.array(RoleResponseSchema) },
            },
            handler: async (_req, res) => {
                res.status(200).json(await service.getRoles());
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get role by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Role found", schema: RoleResponseSchema },
                404: { description: "Not Found - Role not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.getRoleById(req.validated.params.id));
            },
        }),
    ],
});
