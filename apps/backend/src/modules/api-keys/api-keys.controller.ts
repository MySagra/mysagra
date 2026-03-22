import { Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { TypedRequest } from "@/types/request";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyInput, CUIDParam } from "@mysagra/schemas";

export class ApiKeysController {
    constructor(private apiKeyService: ApiKeysService) { }

    getApiKeys = asyncHandler(async (
        req: TypedRequest<{}>,
        res: Response,
    ): Promise<void> => {
        const keys = await this.apiKeyService.getAPIKeys();
        res.status(200).json(keys);
    });

    getApiKey = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const keys = await this.apiKeyService.getAPIKey(id);
        res.status(200).json(keys);
    });

    createApiKey = asyncHandler(async (
        req: TypedRequest<{ body: CreateApiKeyInput }>,
        res: Response,
    ): Promise<void> => {
        const keyResponse = await this.apiKeyService.createApiKey(req.validated.body);
        res.status(201).json(keyResponse);
    });

    revokeApiKey = asyncHandler(async (
        req: TypedRequest<{ params: CUIDParam }>,
        res: Response,
    ): Promise<void> => {
        const { id } = req.validated.params;
        const keyResponse = await this.apiKeyService.revokeApiKey(id);
        res.status(204);
    });
}