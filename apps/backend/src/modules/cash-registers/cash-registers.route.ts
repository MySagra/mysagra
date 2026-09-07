import { z } from "zod";
import { createModule, route, AUTH_RESPONSES } from "@/core/http";
import { authenticate } from "@/middlewares/authenticate";
import { apiLimiter } from "@/middlewares/rateLimiter.middleware";
import { NotFoundError } from "@/common/errors";
import { CashRegistersService } from "@/modules/cash-registers/cash-registers.service";
import {
    CashRegisterResponseSchema,
    CreateCashRegisterSchema,
    UpdateCashRegisterSchema,
    PatchCashRegisterSchema,
    GetCashRegisterQuerySchema,
    cuidParamSchema,
} from "@mysagra/schemas";

const service = new CashRegistersService();

const OpenDrawerResponseSchema = z.object({
    cashRegisterId: z.string().meta({ example: "cjld2cyuq0000t3rmniod1foy" }),
    printerId: z.string().nullable().meta({ example: "printer123" }),
}).meta({ id: "OpenDrawerResponse" });

export const cashRegistersModule = createModule({
    basePath: "/v1/cash-registers",
    tags: ["CashRegisters"],
    limiter: apiLimiter,
    commonResponses: AUTH_RESPONSES,
    routes: [
        route({
            method: "get",
            path: "",
            summary: "Get all cash registers",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            query: GetCashRegisterQuerySchema,
            responses: {
                200: { description: "List of cash registers", schema: z.array(CashRegisterResponseSchema) },
                403: { description: "Forbidden - Operators can only access enabled cash registers" },
            },
            handler: async (req, res) => {
                const query = req.user?.role === "operator"
                    ? { ...req.validated.query, enabled: true }
                    : req.validated.query;
                res.status(200).json(await service.getCashRegisters(query));
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get cash register by ID",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"], ["ms_pt_"])],
            params: cuidParamSchema,
            query: GetCashRegisterQuerySchema,
            responses: {
                200: { description: "Cash register found", schema: CashRegisterResponseSchema },
                404: { description: "Not Found - Cash register not found" },
            },
            handler: async (req, res) => {
                const cashRegister = await service.getCashRegisterById(req.validated.params.id, req.validated.query);
                if (req.user?.role === "operator" && !cashRegister.enabled) {
                    throw new NotFoundError("Cash register not found");
                }
                res.status(200).json(cashRegister);
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create a new cash register",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            body: CreateCashRegisterSchema,
            responses: {
                201: { description: "Cash register created", schema: CashRegisterResponseSchema },
                400: { description: "Invalid input" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.createCashRegister(req.validated.body));
            },
        }),
        route({
            method: "put",
            path: "/{id}",
            summary: "Update cash register by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            body: UpdateCashRegisterSchema,
            responses: {
                200: { description: "Cash register updated", schema: CashRegisterResponseSchema },
                404: { description: "Not Found - Cash register not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.updateCashRegister(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "patch",
            path: "/{id}",
            summary: "Patch cash register enabled status",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            body: PatchCashRegisterSchema,
            responses: {
                200: { description: "Cash register status updated", schema: CashRegisterResponseSchema },
                404: { description: "Not Found - Cash register not found" },
            },
            handler: async (req, res) => {
                res.status(200).json(await service.patchCashRegister(req.validated.params.id, req.validated.body));
            },
        }),
        route({
            method: "delete",
            path: "/{id}",
            summary: "Delete cash register by ID",
            security: [{ cookieAuth: [] }],
            middlewares: [authenticate(["admin"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Cash register deleted" },
                404: { description: "Not Found - Cash register not found" },
            },
            handler: async (req, res) => {
                await service.deleteCashRegister(req.validated.params.id);
                res.status(204).send();
            },
        }),
        route({
            method: "post",
            path: "/{id}/open-drawer",
            summary: "Open cash register drawer",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            middlewares: [authenticate(["admin", "maintainer", "operator"])],
            params: cuidParamSchema,
            responses: {
                200: { description: "Drawer opened successfully", schema: OpenDrawerResponseSchema },
                404: { description: "Not Found - Cash register not found" },
            },
            handler: async (req, res) => {
                res.status(201).json(await service.openDrawer(req.validated.params.id));
            },
        }),
    ],
});
