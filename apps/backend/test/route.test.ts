import { describe, it, expect } from "vitest";
import { z } from "zod";
import { route } from "@/core/http/route";

describe("route()", () => {
    it("returns the same definition object (identity helper for typing)", () => {
        const def = route({
            method: "get",
            path: "/{id}",
            summary: "Example",
            params: z.object({ id: z.string() }),
            responses: { 200: { description: "ok" } },
            handler: (_req, res) => {
                res.status(200).json({ ok: true });
            },
        });

        expect(def.method).toBe("get");
        expect(def.path).toBe("/{id}");
        expect(def.summary).toBe("Example");
        expect(def.responses[200]?.description).toBe("ok");
        expect(typeof def.handler).toBe("function");
    });
});
