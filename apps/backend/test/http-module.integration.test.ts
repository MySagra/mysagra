import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import { z } from "zod";
import { createModule, route, registerModules, registry } from "@/core/http";

// A spy limiter we can assert was mounted for the module.
const limiterCalls = { count: 0 };
const spyLimiter = (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    limiterCalls.count += 1;
    next();
};

const guard = vi.fn((_req: express.Request, _res: express.Response, next: express.NextFunction) => next());

const widgetsModule = createModule({
    basePath: "/v1/widgets",
    tags: ["Widgets"],
    limiter: spyLimiter,
    commonResponses: {
        401: { description: "Unauthorized" },
    },
    routes: [
        route({
            method: "get",
            path: "",
            summary: "List widgets",
            query: z.object({ page: z.coerce.number().default(1) }),
            responses: { 200: { description: "ok", schema: z.array(z.object({ id: z.string() })) } },
            handler: (req, res) => {
                res.status(200).json({ page: req.validated.query.page });
            },
        }),
        route({
            method: "get",
            path: "/{id}",
            summary: "Get widget",
            middlewares: [guard],
            params: z.object({ id: z.string().min(3) }),
            responses: {
                200: { description: "ok" },
                404: { description: "not found" },
            },
            handler: (req, res) => {
                res.status(200).json({ id: req.validated.params.id });
            },
        }),
        route({
            method: "post",
            path: "",
            summary: "Create widget",
            body: z.object({ name: z.string() }),
            responses: { 201: { description: "created" } },
            handler: (req, res) => {
                res.status(201).json({ name: req.validated.body.name });
            },
        }),
    ],
});

function buildApp() {
    const app = express();
    app.use(express.json());
    app.use(registerModules([widgetsModule]));
    return app;
}

describe("createModule + registerModules", () => {
    it("mounts routes at basePath and coerces query defaults", async () => {
        const app = buildApp();
        const res = await request(app).get("/v1/widgets");
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ page: 1 });
    });

    it("translates {param} to express :param and validates it", async () => {
        const app = buildApp();

        const ok = await request(app).get("/v1/widgets/abcd");
        expect(ok.status).toBe(200);
        expect(ok.body).toEqual({ id: "abcd" });

        const bad = await request(app).get("/v1/widgets/ab"); // fails min(3)
        expect(bad.status).toBe(400);
        expect(bad.body.errors).toBeInstanceOf(Array);
    });

    it("runs per-route middlewares before the handler", async () => {
        const app = buildApp();
        guard.mockClear();
        await request(app).get("/v1/widgets/abcd");
        expect(guard).toHaveBeenCalledOnce();
    });

    it("validates request bodies", async () => {
        const app = buildApp();

        const ok = await request(app).post("/v1/widgets").send({ name: "gear" });
        expect(ok.status).toBe(201);
        expect(ok.body).toEqual({ name: "gear" });

        const bad = await request(app).post("/v1/widgets").send({ name: 42 });
        expect(bad.status).toBe(400);
    });

    it("applies the module limiter middleware", async () => {
        const app = buildApp();
        limiterCalls.count = 0;
        await request(app).get("/v1/widgets");
        expect(limiterCalls.count).toBe(1);
    });

    it("registers the routes in the OpenAPI registry with the full path", () => {
        const paths = registry.definitions
            .filter((d) => d.type === "route")
            .map((d) => (d as { route: { path: string; method: string } }).route);

        expect(paths).toContainEqual(expect.objectContaining({ method: "get", path: "/v1/widgets/{id}" }));
        expect(paths).toContainEqual(expect.objectContaining({ method: "post", path: "/v1/widgets" }));
    });

    it("merges commonResponses into each route's OpenAPI responses", () => {
        const def = registry.definitions
            .filter((d) => d.type === "route")
            .map((d) => (d as { route: { path: string; method: string; responses: Record<string, unknown> } }).route)
            .find((r) => r.method === "post" && r.path === "/v1/widgets");

        expect(def).toBeDefined();
        // 201 comes from the route, 401 from commonResponses.
        expect(Object.keys(def!.responses)).toEqual(expect.arrayContaining(["201", "401"]));
    });
});
