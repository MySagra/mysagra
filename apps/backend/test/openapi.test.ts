import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createModule } from "@/core/http/module";
import { route } from "@/core/http/route";
import { generateOpenApiDocument } from "@/core/http/openapi";

// Register a module so the shared registry has at least one documented path.
createModule({
    basePath: "/v1/samples",
    tags: ["Samples"],
    routes: [
        route({
            method: "get",
            path: "/{id}",
            summary: "Get sample",
            security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
            params: z.object({ id: z.string() }),
            responses: {
                200: { description: "ok", schema: z.object({ id: z.string() }) },
            },
            handler: (_req, res) => {
                res.status(200).json({ id: "x" });
            },
        }),
    ],
});

describe("generateOpenApiDocument", () => {
    const doc = generateOpenApiDocument();

    it("produces a valid OpenAPI 3 document", () => {
        expect(doc.openapi).toBe("3.0.0");
        expect(doc.info.title).toBe("MySagra API");
    });

    it("registers both security schemes", () => {
        const schemes = doc.components?.securitySchemes ?? {};
        expect(Object.keys(schemes)).toEqual(expect.arrayContaining(["cookieAuth", "apiKeyAuth"]));
    });

    it("includes the module route in paths with the full base path", () => {
        expect(doc.paths?.["/v1/samples/{id}"]?.get).toBeDefined();
    });
});
