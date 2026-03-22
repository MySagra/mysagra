import { Request, Response, NextFunction } from "express"
import { ApiKeyPrefixSchema } from "@mysagra/schemas";

export function parseApiKey() {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiKeyHeader = req.header('X-API-KEY');

        if (!apiKeyHeader) {
            return next();
        }

        if (typeof apiKeyHeader !== 'string') {
            res.status(400).json({ message: "Malformed X-API-KEY header" });
            return;
        }

        const prefix = apiKeyHeader.substring(0, 6);
        const parsed = ApiKeyPrefixSchema.safeParse(prefix);

        if (!parsed.success) {
            res.status(400).json({ message: "Invalid API key" });
            return;
        }

        req.apiKey = {
            prefix: parsed.data,
            rawKey: apiKeyHeader
        }
        next();
    }
}