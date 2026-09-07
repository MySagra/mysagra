import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import { z } from "zod";
import { validateRequest } from "@/core/http/validateRequest";

function mockRes() {
    const res = {} as Response & { statusCode?: number; body?: unknown };
    res.status = vi.fn().mockImplementation((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.json = vi.fn().mockImplementation((payload: unknown) => {
        res.body = payload;
        return res;
    });
    return res;
}

describe("validateRequest", () => {
    it("populates req.validated with parsed values and calls next()", async () => {
        const middleware = validateRequest({
            params: z.object({ id: z.string() }),
            query: z.object({ page: z.coerce.number() }),
            body: z.object({ name: z.string() }),
        });

        const req = {
            params: { id: "abc" },
            query: { page: "2" },
            body: { name: "pizza" },
        } as unknown as Request;
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(req.validated!.params).toEqual({ id: "abc" });
        expect(req.validated!.query).toEqual({ page: 2 });
        expect(req.validated!.body).toEqual({ name: "pizza" });
    });

    it("responds 400 with issues on invalid input and does not call next()", async () => {
        const middleware = validateRequest({
            body: z.object({ name: z.string() }),
        });

        const req = { body: { name: 123 } } as unknown as Request;
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors: expect.any(Array) }));
    });

    it("only validates the schemas that are provided", async () => {
        const middleware = validateRequest({ params: z.object({ id: z.string() }) });

        const req = { params: { id: "x" } } as unknown as Request;
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(req.validated!.params).toEqual({ id: "x" });
        expect(req.validated!.query).toBeUndefined();
        expect(req.validated!.body).toBeUndefined();
    });
});
